package com.simats.olfactory;

import android.content.Intent;
import android.content.SharedPreferences;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.net.Uri;
import android.os.Bundle;
import android.view.View;
import android.widget.ImageView;
import android.widget.TextView;
import androidx.activity.result.ActivityResultLauncher;
import androidx.activity.result.contract.ActivityResultContracts;
import androidx.appcompat.app.AlertDialog;
import androidx.appcompat.app.AppCompatActivity;
import androidx.cardview.widget.CardView;
import com.google.android.material.bottomnavigation.BottomNavigationView;
import com.google.android.material.button.MaterialButton;
import com.simats.olfactory.network.ApiService;
import com.simats.olfactory.network.RetrofitClient;
import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.io.OutputStream;
import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

public class ProfileActivity extends AppCompatActivity {

    private ImageView ivAvatar;
    private SharedPreferences prefs;

    // Gallery Picker
    private final ActivityResultLauncher<String> galleryLauncher = registerForActivityResult(
            new ActivityResultContracts.GetContent(),
            uri -> {
                if (uri != null) {
                    saveImageToLocal(uri);
                }
            }
    );

    // Camera Picker
    private final ActivityResultLauncher<Void> cameraLauncher = registerForActivityResult(
            new ActivityResultContracts.TakePicturePreview(),
            bitmap -> {
                if (bitmap != null) {
                    saveBitmapToLocal(bitmap);
                }
            }
    );

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_profile);

        // Fix Top Bar overlapping with status bar
        final View tBar = findViewById(R.id.topBar);
        if (tBar != null) {
            androidx.core.view.ViewCompat.setOnApplyWindowInsetsListener(tBar, (v, insets) -> {
                androidx.core.graphics.Insets statusBar = insets.getInsets(androidx.core.view.WindowInsetsCompat.Type.systemBars());
                v.setPadding(v.getPaddingLeft(), statusBar.top, v.getPaddingRight(), v.getPaddingBottom());
                return insets;
            });
        }

        prefs = getSharedPreferences("AuthPrefs", MODE_PRIVATE);
        String fullName = prefs.getString("full_name", "");
        String email    = prefs.getString("email", "");
        String username = prefs.getString("username", "");
        String token    = "Bearer " + prefs.getString("token", "");

        String displayName = (!fullName.isEmpty()) ? fullName
                : (!username.isEmpty()) ? username
                : (!email.isEmpty()) ? email.split("@")[0]
                : "User";

        TextView tvUserName     = findViewById(R.id.tvUserName);
        TextView tvUserEmail    = findViewById(R.id.tvUserEmail);
        TextView tvInfoEmail    = findViewById(R.id.tvInfoEmail);
        TextView tvInfoUsername = findViewById(R.id.tvInfoUsername);

        tvUserName.setText(displayName);
        tvUserEmail.setText(email);
        tvInfoEmail.setText(email.isEmpty() ? "—" : email);
        tvInfoUsername.setText(username.isEmpty() ? "—" : username);

        // Avatar logic
        ivAvatar = findViewById(R.id.ivAvatar);
        CardView cvAvatar = findViewById(R.id.cvAvatar);
        loadSavedAvatar();

        cvAvatar.setOnClickListener(v -> showImageSourceDialog());

        // Load summary stats from API
        ApiService apiService = RetrofitClient.getClient().create(ApiService.class);
        apiService.getSummaryStatistics(token).enqueue(new Callback<ApiService.StatisticsSummaryResponse>() {
            @Override
            public void onResponse(Call<ApiService.StatisticsSummaryResponse> call, Response<ApiService.StatisticsSummaryResponse> response) {}
            @Override
            public void onFailure(Call<ApiService.StatisticsSummaryResponse> call, Throwable t) {}
        });

        // Back button
        ImageView btnBack = findViewById(R.id.btnBack);
        btnBack.setOnClickListener(v -> finish());

        // Logout button
        MaterialButton btnLogout = findViewById(R.id.btnLogout);
        btnLogout.setOnClickListener(v ->
            new AlertDialog.Builder(ProfileActivity.this)
                .setTitle("Logout")
                .setMessage("Are you sure you want to logout?")
                .setPositiveButton("Logout", (dialog, which) -> {
                    prefs.edit().remove("token").apply();
                    Intent intent = new Intent(ProfileActivity.this, LoginActivity.class);
                    intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TASK);
                    startActivity(intent);
                    finish();
                })
                .setNegativeButton("Cancel", null)
                .show()
        );

        // Bottom navigation
        BottomNavigationView bottomNav = findViewById(R.id.bottomNav);
        bottomNav.setSelectedItemId(R.id.nav_profile);
        bottomNav.setOnItemSelectedListener(item -> {
            int id = item.getItemId();
            if (id == R.id.nav_home) {
                startActivity(new Intent(ProfileActivity.this, DashboardActivity.class));
                finish();
            } else if (id == R.id.nav_add) {
                startActivity(new Intent(ProfileActivity.this, PatientDetailsActivity.class));
                finish();
            }
            return true;
        });
    }

    private void showImageSourceDialog() {
        String[] options = {"Camera", "Gallery"};
        new AlertDialog.Builder(this)
            .setTitle("Choose Profile Picture")
            .setItems(options, (dialog, which) -> {
                if (which == 0) {
                    cameraLauncher.launch(null);
                } else {
                    galleryLauncher.launch("image/*");
                }
            })
            .show();
    }

    private void saveImageToLocal(Uri uri) {
        try {
            InputStream inputStream = getContentResolver().openInputStream(uri);
            if (inputStream == null) return;

            File tempFile = new File(getFilesDir(), "avatar.jpg");
            OutputStream outputStream = new FileOutputStream(tempFile);
            
            byte[] buffer = new byte[4 * 1024];
            int read;
            while ((read = inputStream.read(buffer)) != -1) {
                outputStream.write(buffer, 0, read);
            }
            outputStream.flush();
            outputStream.close();
            inputStream.close();
            
            prefs.edit().putString("avatar_path", tempFile.getAbsolutePath()).apply();
            loadSavedAvatar();
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    private void saveBitmapToLocal(Bitmap bitmap) {
        try {
            File tempFile = new File(getFilesDir(), "avatar.jpg");
            OutputStream outputStream = new FileOutputStream(tempFile);
            bitmap.compress(Bitmap.CompressFormat.JPEG, 100, outputStream);
            outputStream.flush();
            outputStream.close();
            
            prefs.edit().putString("avatar_path", tempFile.getAbsolutePath()).apply();
            loadSavedAvatar();
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    private void loadSavedAvatar() {
        String avatarPath = prefs.getString("avatar_path", null);
        if (avatarPath != null) {
            File imgFile = new File(avatarPath);
            if (imgFile.exists()) {
                Bitmap myBitmap = BitmapFactory.decodeFile(imgFile.getAbsolutePath());
                ivAvatar.setImageBitmap(myBitmap);
                ivAvatar.setPadding(0, 0, 0, 0);
                ivAvatar.setImageTintList(null);
            }
        }
    }
}
