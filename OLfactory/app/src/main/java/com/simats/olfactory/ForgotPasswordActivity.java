package com.simats.olfactory;

import android.content.Context;
import android.content.Intent;
import android.os.Bundle;
import android.view.View;
import android.view.inputmethod.InputMethodManager;
import android.widget.TextView;
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

public class ForgotPasswordActivity extends AppCompatActivity {

    private TextInputEditText etEmail;
    private MaterialButton btnSendResetLink;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_forgot_password);

        etEmail = findViewById(R.id.etEmail);
        btnSendResetLink = findViewById(R.id.btnSendResetLink);
        TextView tvBackToLogin = findViewById(R.id.tvBackToLogin);

        btnSendResetLink.setOnClickListener(v -> {
            hideKeyboard();
            sendResetLink();
        });

        tvBackToLogin.setOnClickListener(v -> finish());
    }

    private void hideKeyboard() {
        View view = this.getCurrentFocus();
        if (view != null) {
            InputMethodManager imm = (InputMethodManager) getSystemService(Context.INPUT_METHOD_SERVICE);
            imm.hideSoftInputFromWindow(view.getWindowToken(), 0);
        }
    }

    private void sendResetLink() {
        String email = etEmail.getText().toString().trim();

        if (email.isEmpty()) {
            Toast.makeText(this, "Please enter your email", Toast.LENGTH_SHORT).show();
            return;
        }

        btnSendResetLink.setEnabled(false);
        btnSendResetLink.setText("SENDING...");

        ApiService apiService = RetrofitClient.getClient().create(ApiService.class);
        
        // Corrected: Use EmailRequest instead of ForgotPasswordRequest
        ApiService.EmailRequest request = new ApiService.EmailRequest(email);

        // Corrected: Use StatusResponse instead of ForgotPasswordResponse
        apiService.forgotPassword(request).enqueue(new Callback<ApiService.StatusResponse>() {
            @Override
            public void onResponse(@NonNull Call<ApiService.StatusResponse> call, @NonNull Response<ApiService.StatusResponse> response) {
                btnSendResetLink.setEnabled(true);
                btnSendResetLink.setText("SEND RESET LINK");

                if (response.isSuccessful()) {
                    Toast.makeText(ForgotPasswordActivity.this, "Check your email for the OTP!", Toast.LENGTH_LONG).show();
                    
                    Intent intent = new Intent(ForgotPasswordActivity.this, VerifyOtpActivity.class);
                    startActivity(intent);
                    finish();
                } else {
                    Toast.makeText(ForgotPasswordActivity.this, "Failed to send reset link", Toast.LENGTH_SHORT).show();
                }
            }

            @Override
            public void onFailure(@NonNull Call<ApiService.StatusResponse> call, @NonNull Throwable t) {
                btnSendResetLink.setEnabled(true);
                btnSendResetLink.setText("SEND RESET LINK");
                Toast.makeText(ForgotPasswordActivity.this, "Network Error", Toast.LENGTH_SHORT).show();
            }
        });
    }
}
