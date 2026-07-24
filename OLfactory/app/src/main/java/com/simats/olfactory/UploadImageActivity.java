package com.simats.olfactory;

import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.view.View;
import android.widget.ImageView;
import android.widget.Toast;

import androidx.activity.result.ActivityResultLauncher;
import androidx.activity.result.contract.ActivityResultContracts;
import androidx.appcompat.app.AppCompatActivity;

import com.google.android.material.bottomnavigation.BottomNavigationView;
import com.google.android.material.button.MaterialButton;
import com.simats.olfactory.network.ApiService;
import com.simats.olfactory.network.RetrofitClient;

import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.io.OutputStream;

import okhttp3.MediaType;
import okhttp3.MultipartBody;
import okhttp3.RequestBody;
import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

public class UploadImageActivity extends AppCompatActivity {

    private Uri imageUri;
    private MaterialButton btnUpload;
    private ImageView ivPreview;

    // The modern, permission-less ActivityResultLauncher to pick an image
    private final ActivityResultLauncher<String> getContent = registerForActivityResult(
            new ActivityResultContracts.GetContent(),
            uri -> {
                if (uri != null) {
                    imageUri = uri;
                    ivPreview.setImageURI(imageUri);
                    btnUpload.setText("ANALYZE IMAGE");
                    btnUpload.setIconResource(android.R.drawable.ic_menu_search);
                    Toast.makeText(this, "Image selected! Click to analyze.", Toast.LENGTH_SHORT).show();
                }
            }
    );

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_upload_image);
 
        // Handle Camera cutout / Safe Area
        final android.view.View tBar = findViewById(R.id.topBar);
        if (tBar != null) {
            androidx.core.view.ViewCompat.setOnApplyWindowInsetsListener(tBar, (v, insets) -> {
                androidx.core.graphics.Insets statusBar = insets.getInsets(androidx.core.view.WindowInsetsCompat.Type.systemBars());
                v.setPadding(v.getPaddingLeft(), statusBar.top, v.getPaddingRight(), v.getPaddingBottom());
                return insets;
            });
        }

        ImageView btnBack = findViewById(R.id.btnBack);
        btnUpload = findViewById(R.id.btnUpload);
        ivPreview = findViewById(R.id.ivPreview);

        btnBack.setOnClickListener(v -> finish());

        btnUpload.setOnClickListener(v -> {
            if (imageUri == null) {
                // If no image is selected yet, launch the system photo picker
                getContent.launch("image/*");
            } else {
                // If an image is selected, proceed to upload
                uploadImage();
            }
        });

        BottomNavigationView bottomNav = findViewById(R.id.bottomNav);
        bottomNav.setOnItemSelectedListener(item -> {
            int id = item.getItemId();
            if (id == R.id.nav_home) {
                startActivity(new Intent(UploadImageActivity.this, DashboardActivity.class));
                finish();
            } else if (id == R.id.nav_profile) {
                startActivity(new Intent(UploadImageActivity.this, ProfileActivity.class));
                finish();
            }
            return true;
        });
    }

    private void uploadImage() {
        // Copy the URI stream to a temporary local file to bypass Scope Storage issues entirely
        File file = uriToFile(imageUri);
        if (file == null) {
            Toast.makeText(this, "Failed to read image", Toast.LENGTH_SHORT).show();
            return;
        }

        RequestBody requestFile = RequestBody.create(file, MediaType.parse(getContentResolver().getType(imageUri)));
        MultipartBody.Part body = MultipartBody.Part.createFormData("image", file.getName(), requestFile);
        RequestBody notes = RequestBody.create("Uploaded from Android", MediaType.parse("text/plain"));

        btnUpload.setEnabled(false);
        // Just launch ResultActivity and let it handle the analysis API call
        Intent intent = new Intent(UploadImageActivity.this, ResultActivity.class);
        intent.putExtra("PATIENT_ID", getIntent().getIntExtra("PATIENT_ID", 1));
        intent.putExtra("IMAGE_URI", imageUri.toString());
        startActivity(intent);
        
        btnUpload.setEnabled(true);
        btnUpload.setText("ANALYZE IMAGE");
    }

    /**
     * Helper to read the content URI into a temporary application cache file.
     * This solves all Android 10+ (API 29+) Scoped Storage strict errors.
     */
    private File uriToFile(Uri uri) {
        try {
            InputStream inputStream = getContentResolver().openInputStream(uri);
            if (inputStream == null) return null;

            File tempFile = new File(getCacheDir(), "upload_image_" + System.currentTimeMillis() + ".jpg");
            OutputStream outputStream = new FileOutputStream(tempFile);
            
            byte[] buffer = new byte[4 * 1024]; // 4kb buffer
            int read;
            while ((read = inputStream.read(buffer)) != -1) {
                outputStream.write(buffer, 0, read);
            }
            outputStream.flush();
            outputStream.close();
            inputStream.close();
            
            return tempFile;
        } catch (Exception e) {
            e.printStackTrace();
            return null;
        }
    }
}
