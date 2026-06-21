package com.traveldiary;

import io.quarkus.test.junit.QuarkusTest;
import io.quarkus.test.junit.mockito.InjectSpy;

import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.mockito.Mockito;

import com.drew.imaging.ImageMetadataReader;
import com.drew.metadata.exif.ExifIFD0Directory;
import com.drew.metadata.exif.GpsDirectory;
import com.traveldiary.exception.BadRequestException;
import com.traveldiary.service.UploadService;

import javax.imageio.ImageIO;
import java.awt.Color;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertThrows;

@QuarkusTest
class UploadServiceTest {

    @InjectSpy
    UploadService uploadService;

    @Test
    void uploadPhoto_heicMime_throwsBadRequest() {
        var e = assertThrows(BadRequestException.class,
                () -> uploadService.uploadPhoto(new byte[]{1, 2, 3}, "image/heic", "x.heic"));
        assertThat(e.getMessage()).contains("HEIC");
    }

    @Test
    void uploadPhoto_heifMime_throwsBadRequest() {
        assertThrows(BadRequestException.class,
                () -> uploadService.uploadPhoto(new byte[]{1, 2, 3}, "image/heif", "x.heif"));
    }

    @Test
    void uploadPhoto_unsupportedMime_throwsBadRequest() {
        assertThrows(BadRequestException.class,
                () -> uploadService.uploadPhoto(new byte[]{1, 2, 3}, "image/gif", "x.gif"));
    }

    @Test
    void uploadPhoto_oversize_throwsBadRequest() {
        var huge = new byte[16 * 1024 * 1024];
        assertThrows(BadRequestException.class,
                () -> uploadService.uploadPhoto(huge, "image/jpeg", "x.jpg"));
    }

    @Test
    void applyOrientation_orient1_returnsSameInstance() {
        var src = new BufferedImage(4, 2, BufferedImage.TYPE_INT_RGB);
        assertSame(src, UploadService.applyOrientation(src, 1));
    }

    @Test
    void applyOrientation_orient6_rotates90ClockwiseAndSwapsDimensions() {
        // 4-wide × 2-tall landscape, distinct corner pixels.
        var src = new BufferedImage(4, 2, BufferedImage.TYPE_INT_RGB);
        src.setRGB(0, 0, 0xFF0000); // top-left
        src.setRGB(3, 0, 0x00FF00); // top-right
        src.setRGB(3, 1, 0x0000FF); // bottom-right
        src.setRGB(0, 1, 0xFFFF00); // bottom-left

        var out = UploadService.applyOrientation(src, 6);

        assertEquals(2, out.getWidth(), "rotated portrait width = old height");
        assertEquals(4, out.getHeight(), "rotated portrait height = old width");
        // 90° CW: old top-left (red) → new top-right; old top-right (green) → new bottom-right;
        // old bottom-right (blue) → new bottom-left; old bottom-left (yellow) → new top-left.
        assertEquals(0xFF0000, out.getRGB(1, 0) & 0xFFFFFF);
        assertEquals(0x00FF00, out.getRGB(1, 3) & 0xFFFFFF);
        assertEquals(0x0000FF, out.getRGB(0, 3) & 0xFFFFFF);
        assertEquals(0xFFFF00, out.getRGB(0, 0) & 0xFFFFFF);
    }

    @Test
    void applyOrientation_orient3_rotates180() {
        var src = new BufferedImage(2, 2, BufferedImage.TYPE_INT_RGB);
        src.setRGB(0, 0, 0xFF0000);
        src.setRGB(1, 0, 0x00FF00);
        src.setRGB(1, 1, 0x0000FF);
        src.setRGB(0, 1, 0xFFFF00);

        var out = UploadService.applyOrientation(src, 3);

        assertEquals(2, out.getWidth());
        assertEquals(2, out.getHeight());
        assertEquals(0x0000FF, out.getRGB(0, 0) & 0xFFFFFF);
        assertEquals(0xFFFF00, out.getRGB(1, 0) & 0xFFFFFF);
        assertEquals(0xFF0000, out.getRGB(1, 1) & 0xFFFFFF);
        assertEquals(0x00FF00, out.getRGB(0, 1) & 0xFFFFFF);
    }

    @Test
    void applyOrientation_orient8_rotates90CounterClockwise() {
        var src = new BufferedImage(4, 2, BufferedImage.TYPE_INT_RGB);
        src.setRGB(0, 0, 0xFF0000);
        src.setRGB(3, 0, 0x00FF00);
        src.setRGB(3, 1, 0x0000FF);
        src.setRGB(0, 1, 0xFFFF00);

        var out = UploadService.applyOrientation(src, 8);

        assertEquals(2, out.getWidth());
        assertEquals(4, out.getHeight());
        // 90° CCW: old top-left (red) → new bottom-left; old top-right (green) → new top-left.
        assertEquals(0xFF0000, out.getRGB(0, 3) & 0xFFFFFF);
        assertEquals(0x00FF00, out.getRGB(0, 0) & 0xFFFFFF);
        assertEquals(0x0000FF, out.getRGB(1, 0) & 0xFFFFFF);
        assertEquals(0xFFFF00, out.getRGB(1, 3) & 0xFFFFFF);
    }

    @Test
    void uploadPhoto_realJpeg_uploadsThreeVariantsWithoutExif() throws Exception {
        var jpegBytes = buildJpeg(2400, 1600);

        var keyCaptor = ArgumentCaptor.forClass(String.class);
        var bytesCaptor = ArgumentCaptor.forClass(byte[].class);
        Mockito.doNothing().when(uploadService).put(keyCaptor.capture(), bytesCaptor.capture());

        var result = uploadService.uploadPhoto(jpegBytes, "image/jpeg", "test.jpg");

        var keys = keyCaptor.getAllValues();
        assertThat(keys).hasSize(3);
        assertThat(keys.get(0)).endsWith(".jpg");
        assertThat(keys.get(0)).doesNotContain("-m.jpg").doesNotContain("-t.jpg");
        assertThat(keys.get(1)).endsWith("-m.jpg");
        assertThat(keys.get(2)).endsWith("-t.jpg");

        assertThat(result.url()).endsWith(keys.get(0));
        assertThat(result.urlMed()).endsWith(keys.get(1));
        assertThat(result.urlThumb()).endsWith(keys.get(2));
        assertThat(result.width()).isEqualTo(1800);

        for (var bytes : bytesCaptor.getAllValues()) {
            var meta = ImageMetadataReader.readMetadata(new ByteArrayInputStream(bytes));
            assertThat(meta.getFirstDirectoryOfType(ExifIFD0Directory.class)).isNull();
            assertThat(meta.getFirstDirectoryOfType(GpsDirectory.class)).isNull();
        }
    }

    private static byte[] buildJpeg(int w, int h) throws Exception {
        var img = new BufferedImage(w, h, BufferedImage.TYPE_INT_RGB);
        var g = img.createGraphics();
        g.setColor(Color.BLUE);
        g.fillRect(0, 0, w, h);
        g.dispose();
        var baos = new ByteArrayOutputStream();
        ImageIO.write(img, "jpeg", baos);
        return baos.toByteArray();
    }
}
