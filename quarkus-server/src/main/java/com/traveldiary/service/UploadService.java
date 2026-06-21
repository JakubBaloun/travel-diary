package com.traveldiary.service;

import jakarta.annotation.PostConstruct;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

import javax.imageio.ImageIO;
import javax.imageio.ImageWriteParam;
import javax.imageio.ImageWriter;
import java.awt.Graphics2D;
import java.awt.RenderingHints;
import java.awt.geom.AffineTransform;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.UUID;

import org.eclipse.microprofile.config.inject.ConfigProperty;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.DeleteObjectRequest;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;

import com.drew.imaging.ImageMetadataReader;
import com.drew.metadata.exif.ExifIFD0Directory;
import com.traveldiary.exception.BadRequestException;

import java.net.URI;

@ApplicationScoped
public class UploadService {

    public record UploadResult(String url, String urlMed, String urlThumb, int width, int height) {}

    private S3Client s3;
    private String bucket;
    private String publicUrl;

    @Inject
    @ConfigProperty(name = "app.b2.endpoint")
    String endpoint;

    @Inject
    @ConfigProperty(name = "app.b2.region")
    String region;

    @Inject
    @ConfigProperty(name = "app.b2.access-key-id")
    String accessKeyId;

    @Inject
    @ConfigProperty(name = "app.b2.secret-access-key")
    String secretAccessKey;

    @Inject
    @ConfigProperty(name = "app.b2.bucket-name")
    String bucketName;

    @Inject
    @ConfigProperty(name = "app.b2.public-url")
    String b2PublicUrl;

    private static final int WIDTH_FULL = 1800;
    private static final int WIDTH_MED = 1000;
    private static final int WIDTH_THUMB = 400;
    private static final int JPEG_QUALITY = 80;
    private static final long MAX_FILE_SIZE = 15 * 1024 * 1024;
    private static final String CACHE_CONTROL = "public, max-age=31536000, immutable";

    private static final java.util.Set<String> ALLOWED_MIME = java.util.Set.of(
            "image/jpeg", "image/png", "image/webp"
    );
    private static final java.util.Set<String> HEIC_MIME = java.util.Set.of(
            "image/heic", "image/heif"
    );

    @PostConstruct
    void init() {
        this.s3 = S3Client.builder()
                .endpointOverride(URI.create(endpoint))
                .region(Region.of(region))
                .credentialsProvider(() -> AwsBasicCredentials.create(accessKeyId, secretAccessKey))
                .forcePathStyle(true)
                .build();
        this.bucket = bucketName;
        this.publicUrl = b2PublicUrl;
    }

    public UploadResult uploadPhoto(byte[] data, String contentType, String filename) {
        if (data.length > MAX_FILE_SIZE) {
            throw new BadRequestException("Soubor je moc velký. Maximum je 15 MB.");
        }

        var mime = contentType != null ? contentType.toLowerCase() : "image/jpeg";
        if (HEIC_MIME.contains(mime)) {
            throw new BadRequestException(
                    "HEIC/HEIF zatím nepodporujeme. Na iPhonu zapni Settings → Camera → Formats → Most Compatible (JPEG).");
        }
        if (!ALLOWED_MIME.contains(mime)) {
            throw new BadRequestException("Nepodporovaný formát: " + mime + ". Podporujeme JPEG, PNG, WebP.");
        }

        int orientation = readOrientation(data);

        BufferedImage image;
        try {
            image = ImageIO.read(new ByteArrayInputStream(data));
        } catch (IOException e) {
            throw new BadRequestException("Fotku se nepodařilo načíst: " + e.getMessage());
        }
        if (image == null) {
            throw new BadRequestException("Nepodporovaný nebo poškozený obrázek.");
        }

        // Bake EXIF orientation into pixels BEFORE re-encode (which strips all metadata).
        var oriented = applyOrientation(image, orientation);

        var stamp = System.currentTimeMillis();
        var id = UUID.randomUUID().toString().substring(0, 8);

        var full = resize(oriented, WIDTH_FULL);
        var med = resize(oriented, WIDTH_MED);
        var thumb = resize(oriented, WIDTH_THUMB);

        var keyFull = "photos/" + stamp + "-" + id + ".jpg";
        var keyMed = "photos/" + stamp + "-" + id + "-m.jpg";
        var keyThumb = "photos/" + stamp + "-" + id + "-t.jpg";

        put(keyFull, encodeJpeg(full));
        put(keyMed, encodeJpeg(med));
        put(keyThumb, encodeJpeg(thumb));

        return new UploadResult(
                publicUrl + "/" + keyFull,
                publicUrl + "/" + keyMed,
                publicUrl + "/" + keyThumb,
                full.getWidth(),
                full.getHeight()
        );
    }

    /** Deletes all 3 variants. Tolerates missing variants (best-effort cleanup). */
    public void deletePhoto(String fullUrl) {
        if (fullUrl == null || !fullUrl.startsWith(publicUrl + "/")) return;
        var keyFull = fullUrl.substring(publicUrl.length() + 1);
        if (!keyFull.endsWith(".jpg")) return;

        var base = keyFull.substring(0, keyFull.length() - ".jpg".length());
        deleteKey(keyFull);
        deleteKey(base + "-m.jpg");
        deleteKey(base + "-t.jpg");
    }

    private void deleteKey(String key) {
        try {
            s3.deleteObject(DeleteObjectRequest.builder().bucket(bucket).key(key).build());
        } catch (Exception ignored) {
            // best-effort
        }
    }

    public void put(String key, byte[] bytes) {
        s3.putObject(PutObjectRequest.builder()
                .bucket(bucket)
                .key(key)
                .contentType("image/jpeg")
                .contentLength((long) bytes.length)
                .cacheControl(CACHE_CONTROL)
                .build(), RequestBody.fromBytes(bytes));
    }

    private static int readOrientation(byte[] data) {
        try {
            var meta = ImageMetadataReader.readMetadata(new ByteArrayInputStream(data));
            var dir = meta.getFirstDirectoryOfType(ExifIFD0Directory.class);
            if (dir != null && dir.containsTag(ExifIFD0Directory.TAG_ORIENTATION)) {
                return dir.getInt(ExifIFD0Directory.TAG_ORIENTATION);
            }
        } catch (Exception ignored) {
            // no EXIF or unreadable → treat as upright
        }
        return 1;
    }

    public static BufferedImage applyOrientation(BufferedImage src, int orientation) {
        if (orientation <= 1 || orientation > 8) return src;

        int w = src.getWidth();
        int h = src.getHeight();
        var t = new AffineTransform();
        boolean swap = orientation >= 5;
        int newW = swap ? h : w;
        int newH = swap ? w : h;

        switch (orientation) {
            case 2 -> { t.translate(w, 0); t.scale(-1, 1); }
            case 3 -> { t.translate(w, h); t.rotate(Math.PI); }
            case 4 -> { t.translate(0, h); t.scale(1, -1); }
            case 5 -> { t.rotate(-Math.PI / 2); t.scale(-1, 1); }
            case 6 -> { t.translate(h, 0); t.rotate(Math.PI / 2); }
            case 7 -> { t.scale(-1, 1); t.translate(-h, 0); t.translate(0, w); t.rotate(3 * Math.PI / 2); }
            case 8 -> { t.translate(0, w); t.rotate(3 * Math.PI / 2); }
            default -> { return src; }
        }

        var out = new BufferedImage(newW, newH, BufferedImage.TYPE_INT_RGB);
        var g = out.createGraphics();
        g.setRenderingHint(RenderingHints.KEY_INTERPOLATION, RenderingHints.VALUE_INTERPOLATION_BICUBIC);
        g.setRenderingHint(RenderingHints.KEY_RENDERING, RenderingHints.VALUE_RENDER_QUALITY);
        g.drawImage(src, t, null);
        g.dispose();
        return out;
    }

    private static BufferedImage resize(BufferedImage image, int maxWidth) {
        int w = image.getWidth();
        int h = image.getHeight();
        if (w <= maxWidth) {
            // Already small enough — but force TYPE_INT_RGB so JPEG encode is consistent.
            if (image.getType() == BufferedImage.TYPE_INT_RGB) return image;
            var copy = new BufferedImage(w, h, BufferedImage.TYPE_INT_RGB);
            var g = copy.createGraphics();
            g.drawImage(image, 0, 0, null);
            g.dispose();
            return copy;
        }
        int newW = maxWidth;
        int newH = (int) Math.round((double) h / w * maxWidth);
        var resized = new BufferedImage(newW, newH, BufferedImage.TYPE_INT_RGB);
        var g2d = resized.createGraphics();
        g2d.setRenderingHint(RenderingHints.KEY_INTERPOLATION, RenderingHints.VALUE_INTERPOLATION_BICUBIC);
        g2d.setRenderingHint(RenderingHints.KEY_RENDERING, RenderingHints.VALUE_RENDER_QUALITY);
        g2d.drawImage(image, 0, 0, newW, newH, null);
        g2d.dispose();
        return resized;
    }

    private static byte[] encodeJpeg(BufferedImage image) {
        var writer = getJPEGWriter();
        var params = writer.getDefaultWriteParam();
        params.setCompressionMode(ImageWriteParam.MODE_EXPLICIT);
        params.setCompressionQuality(JPEG_QUALITY / 100.0f);

        var baos = new ByteArrayOutputStream();
        try {
            try (var ios = ImageIO.createImageOutputStream(baos)) {
                writer.setOutput(ios);
                writer.write(null, new javax.imageio.IIOImage(image, null, null), params);
            }
        } catch (IOException e) {
            throw new RuntimeException("Failed to encode JPEG", e);
        } finally {
            writer.dispose();
        }
        return baos.toByteArray();
    }

    private static ImageWriter getJPEGWriter() {
        var iter = ImageIO.getImageWritersByFormatName("jpeg");
        if (!iter.hasNext()) {
            throw new RuntimeException("No JPEG writer available");
        }
        return iter.next();
    }
}
