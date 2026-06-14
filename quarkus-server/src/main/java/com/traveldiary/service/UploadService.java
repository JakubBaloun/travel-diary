package com.traveldiary.service;

import jakarta.annotation.PostConstruct;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

import javax.imageio.ImageIO;
import javax.imageio.ImageWriteParam;
import javax.imageio.ImageWriter;
import java.awt.Graphics2D;
import java.awt.RenderingHints;
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

import com.traveldiary.exception.BadRequestException;

import java.net.URI;

@ApplicationScoped
public class UploadService {

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

    private static final int MAX_WIDTH = 1800;
    private static final int JPEG_QUALITY = 80;
    private static final long MAX_FILE_SIZE = 10 * 1024 * 1024;
    private static final java.util.Set<String> ALLOWED_MIME = java.util.Set.of(
            "image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"
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

    public String uploadPhoto(byte[] data, String contentType, String filename) {
        if (data.length > MAX_FILE_SIZE) {
            throw new BadRequestException("File too large. Maximum size is 10 MB");
        }

        var mime = contentType != null ? contentType.toLowerCase() : "image/jpeg";
        if (!ALLOWED_MIME.contains(mime)) {
            throw new BadRequestException("Unsupported image type: " + mime);
        }

        BufferedImage image;
        try {
            image = ImageIO.read(new ByteArrayInputStream(data));
        } catch (IOException e) {
            throw new BadRequestException("Failed to read image: " + e.getMessage());
        }

        if (image == null) {
            throw new BadRequestException("Unsupported or corrupted image format");
        }

        var resized = resize(image, MAX_WIDTH);

        var writer = getJPEGWriter();
        var params = writer.getDefaultWriteParam();
        params.setCompressionMode(ImageWriteParam.MODE_EXPLICIT);
        params.setCompressionQuality(JPEG_QUALITY / 100.0f);

        var baos = new ByteArrayOutputStream();
        try {
            writer.setOutput(ImageIO.createImageOutputStream(baos));
            writer.write(resized);
            writer.dispose();
        } catch (IOException e) {
            throw new RuntimeException("Failed to encode JPEG", e);
        }

        var jpegData = baos.toByteArray();
        var key = "photos/" + System.currentTimeMillis() + "-" + UUID.randomUUID().toString().substring(0, 6) + ".jpg";

        s3.putObject(PutObjectRequest.builder()
                .bucket(bucket)
                .key(key)
                .contentType("image/jpeg")
                .contentLength((long) jpegData.length)
                .build(), RequestBody.fromBytes(jpegData));

        return publicUrl + "/" + key;
    }

    public void deletePhoto(String url) {
        var key = url.replace(publicUrl + "/", "");
        s3.deleteObject(DeleteObjectRequest.builder()
                .bucket(bucket)
                .key(key)
                .build());
    }

    private BufferedImage resize(BufferedImage image, int maxWidth) {
        int w = image.getWidth();
        int h = image.getHeight();

        if (w <= maxWidth) {
            return image;
        }

        int newW = maxWidth;
        int newH = (int) ((double) h / w * maxWidth);

        var resized = new BufferedImage(newW, newH, BufferedImage.TYPE_INT_RGB);
        var g2d = resized.createGraphics();
        g2d.setRenderingHint(RenderingHints.KEY_INTERPOLATION, RenderingHints.VALUE_INTERPOLATION_BICUBIC);
        g2d.setRenderingHint(RenderingHints.KEY_RENDERING, RenderingHints.VALUE_RENDER_QUALITY);
        g2d.drawImage(image, 0, 0, newW, newH, null);
        g2d.dispose();

        return resized;
    }

    private ImageWriter getJPEGWriter() {
        var iter = ImageIO.getImageWritersByFormatName("jpeg");
        if (!iter.hasNext()) {
            throw new RuntimeException("No JPEG writer available");
        }
        return iter.next();
    }
}
