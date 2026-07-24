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

public class VerifyOtpActivity extends AppCompatActivity {

    private TextInputEditText etToken;
    private MaterialButton btnVerifyOtp;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_verify_otp);

        etToken = findViewById(R.id.etToken);
        btnVerifyOtp = findViewById(R.id.btnVerifyOtp);

        btnVerifyOtp.setOnClickListener(v -> {
            hideKeyboard();
            verifyOtp();
        });
    }

    private void hideKeyboard() {
        View view = this.getCurrentFocus();
        if (view != null) {
            InputMethodManager imm = (InputMethodManager) getSystemService(Context.INPUT_METHOD_SERVICE);
            imm.hideSoftInputFromWindow(view.getWindowToken(), 0);
        }
    }

    private void verifyOtp() {
        String token = etToken.getText().toString().trim();

        if (token.isEmpty()) {
            Toast.makeText(this, "Please enter the verification code", Toast.LENGTH_SHORT).show();
            return;
        }

        btnVerifyOtp.setEnabled(false);
        btnVerifyOtp.setText("VERIFYING...");

        ApiService apiService = RetrofitClient.getClient().create(ApiService.class);
        ApiService.VerifyOtpRequest request = new ApiService.VerifyOtpRequest(token);

        apiService.verifyOtp(request).enqueue(new Callback<ApiService.VerifyOtpResponse>() {
            @Override
            public void onResponse(@NonNull Call<ApiService.VerifyOtpResponse> call, @NonNull Response<ApiService.VerifyOtpResponse> response) {
                btnVerifyOtp.setEnabled(true);
                btnVerifyOtp.setText("VERIFY CODE");

                if (response.isSuccessful()) {
                    // Navigate to final Reset Password screen, pass the valid token
                    Intent intent = new Intent(VerifyOtpActivity.this, ResetPasswordActivity.class);
                    intent.putExtra("token", token);
                    startActivity(intent);
                    finish();
                } else {
                    Toast.makeText(VerifyOtpActivity.this, "Invalid or expired OTP", Toast.LENGTH_SHORT).show();
                }
            }

            @Override
            public void onFailure(@NonNull Call<ApiService.VerifyOtpResponse> call, @NonNull Throwable t) {
                btnVerifyOtp.setEnabled(true);
                btnVerifyOtp.setText("VERIFY CODE");
                Toast.makeText(VerifyOtpActivity.this, "Network Error", Toast.LENGTH_SHORT).show();
            }
        });
    }
}
