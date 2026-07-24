package com.simats.olfactory;

import android.content.Context;
import android.content.Intent;
import android.os.Bundle;
import android.view.View;
import android.view.inputmethod.InputMethodManager;
import android.widget.Toast;

import androidx.annotation.NonNull;
import androidx.appcompat.app.AppCompatActivity;

import com.google.android.material.button.MaterialButton;
import com.google.android.material.textfield.TextInputEditText;
import com.simats.olfactory.network.ApiService;
import com.simats.olfactory.network.RetrofitClient;

import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

public class ResetPasswordActivity extends AppCompatActivity {

    private TextInputEditText etNewPassword, etConfirmPassword;
    private MaterialButton btnResetPassword;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_reset_password);

        etNewPassword = findViewById(R.id.etNewPassword);
        etConfirmPassword = findViewById(R.id.etConfirmPassword);
        btnResetPassword = findViewById(R.id.btnResetPassword);

        // Token comes from VerifyOtpActivity (already validated)
        String token = getIntent().getStringExtra("token");
        if (token == null || token.isEmpty()) {
            // Should never happen, but guard anyway
            Toast.makeText(this, "Session expired. Please start again.", Toast.LENGTH_LONG).show();
            finish();
            return;
        }

        btnResetPassword.setOnClickListener(v -> {
            hideKeyboard();
            resetPassword(token);
        });
    }

    private void hideKeyboard() {
        View view = this.getCurrentFocus();
        if (view != null) {
            InputMethodManager imm = (InputMethodManager) getSystemService(Context.INPUT_METHOD_SERVICE);
            imm.hideSoftInputFromWindow(view.getWindowToken(), 0);
        }
    }

    private void resetPassword(String token) {
        String newPassword = etNewPassword.getText().toString().trim();
        String confirmPassword = etConfirmPassword.getText().toString().trim();

        if (newPassword.isEmpty() || confirmPassword.isEmpty()) {
            Toast.makeText(this, "Please fill all fields", Toast.LENGTH_SHORT).show();
            return;
        }

        if (!newPassword.equals(confirmPassword)) {
            Toast.makeText(this, "Passwords do not match", Toast.LENGTH_SHORT).show();
            return;
        }

        if (newPassword.length() < 8) {
            Toast.makeText(this, "Password must be at least 8 characters", Toast.LENGTH_SHORT).show();
            return;
        }

        btnResetPassword.setEnabled(false);
        btnResetPassword.setText("UPDATING...");

        ApiService apiService = RetrofitClient.getClient().create(ApiService.class);
        ApiService.ResetPasswordRequest request = new ApiService.ResetPasswordRequest(token, newPassword);

        apiService.resetPassword(request).enqueue(new Callback<ApiService.ResetPasswordResponse>() {
            @Override
            public void onResponse(@NonNull Call<ApiService.ResetPasswordResponse> call, @NonNull Response<ApiService.ResetPasswordResponse> response) {
                btnResetPassword.setEnabled(true);
                btnResetPassword.setText("UPDATE PASSWORD");

                if (response.isSuccessful()) {
                    Toast.makeText(ResetPasswordActivity.this, "Password Reset Successfully!", Toast.LENGTH_LONG).show();
                    
                    // Go to Login Activity
                    Intent intent = new Intent(ResetPasswordActivity.this, LoginActivity.class);
                    intent.addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_NEW_TASK);
                    startActivity(intent);
                    finish();
                } else {
                    Toast.makeText(ResetPasswordActivity.this, "Token expired or invalid", Toast.LENGTH_SHORT).show();
                }
            }

            @Override
            public void onFailure(@NonNull Call<ApiService.ResetPasswordResponse> call, @NonNull Throwable t) {
                btnResetPassword.setEnabled(true);
                btnResetPassword.setText("UPDATE PASSWORD");
                Toast.makeText(ResetPasswordActivity.this, "Network Error", Toast.LENGTH_SHORT).show();
            }
        });
    }
}
