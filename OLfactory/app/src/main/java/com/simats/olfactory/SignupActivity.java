package com.simats.olfactory;

import android.content.Intent;
import android.os.Bundle;
import android.widget.TextView;
import androidx.appcompat.app.AppCompatActivity;

import com.google.android.material.button.MaterialButton;

import android.widget.EditText;
import android.widget.Toast;
import com.simats.olfactory.network.ApiService;
import com.simats.olfactory.network.RetrofitClient;
import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

public class SignupActivity extends AppCompatActivity {

    private EditText etName, etEmail, etPassword;
    private MaterialButton btnSignup;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_signup);

        etName = findViewById(R.id.etName);
        etEmail = findViewById(R.id.etEmail);
        etPassword = findViewById(R.id.etPassword);
        btnSignup = findViewById(R.id.btnSignup);
        TextView tvLogin = findViewById(R.id.tvLogin);

        btnSignup.setOnClickListener(v -> {
            performSignup();
        });

        tvLogin.setOnClickListener(v -> {
            startActivity(new Intent(SignupActivity.this, LoginActivity.class));
        });
    }

    private void performSignup() {
        String name = etName.getText().toString().trim();
        String emailRaw = etEmail.getText().toString().trim();
        String password = etPassword.getText().toString().trim();

        if (emailRaw.isEmpty() || password.isEmpty()) {
            Toast.makeText(this, "Please fill all required fields", Toast.LENGTH_SHORT).show();
            return;
        }

        // STRICT EMAIL VALIDATION: Reject if any capital letter is present
        if (!emailRaw.equals(emailRaw.toLowerCase())) {
            Toast.makeText(this, "Email is invalid. Please use only lowercase letters.", Toast.LENGTH_LONG).show();
            return;
        }
        
        String email = emailRaw; // Already checked to be lowercase

        // Strong Password Validation (8+ chars, Uppercase, Lowercase, Number)
        String passwordPattern = "^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z]).{8,}$";
        if (!password.matches(passwordPattern)) {
            Toast.makeText(this, "Password must be at least 8 characters and include Uppercase, Lowercase, and Numbers", Toast.LENGTH_LONG).show();
            return;
        }

        btnSignup.setEnabled(false);
        btnSignup.setText("Registering...");

        // Derive username from email (before @)
        String username = email.contains("@") ? email.split("@")[0] : email;

        ApiService apiService = RetrofitClient.getClient().create(ApiService.class);
        ApiService.UserRegister request = new ApiService.UserRegister(username, email, password, name.isEmpty() ? username : name);

        apiService.register(request).enqueue(new Callback<ApiService.UserResponse>() {
            @Override
            public void onResponse(Call<ApiService.UserResponse> call, Response<ApiService.UserResponse> response) {
                btnSignup.setEnabled(true);
                btnSignup.setText("SIGN UP");

                if (response.isSuccessful() && response.body() != null) {
                    // Save basic session info so Profile can show the name
                    android.content.SharedPreferences prefs = getSharedPreferences("AuthPrefs", MODE_PRIVATE);
                    prefs.edit()
                        .putString("full_name", name)
                        .putString("email", email)
                        .putString("username", username)
                        .putString("password", password)
                        .apply();

                    Runnable finishSignup = () -> {
                        Toast.makeText(SignupActivity.this, "Registration Successful! Please login.", Toast.LENGTH_LONG).show();
                        startActivity(new Intent(SignupActivity.this, LoginActivity.class));
                        finish();
                    };

                    // Simulate "Save to Chrome" but reliably store locally
                    new androidx.appcompat.app.AlertDialog.Builder(SignupActivity.this)
                        .setTitle("Save Credentials")
                        .setMessage("Would you like to save this email and password for future logins?")
                        .setPositiveButton("Save", (dialog, which) -> {
                            try {
                                String savedAccountsStr = prefs.getString("saved_accounts", "{}");
                                org.json.JSONObject savedAccounts = new org.json.JSONObject(savedAccountsStr);
                                savedAccounts.put(email, password);
                                prefs.edit().putString("saved_accounts", savedAccounts.toString()).apply();
                            } catch (Exception e) { e.printStackTrace(); }
                            finishSignup.run();
                        })
                        .setNegativeButton("Not Now", (dialog, which) -> finishSignup.run())
                        .setCancelable(false)
                        .show();
                } else {
                    // Show clear, user-friendly error messages
                    String errorMsg = "Registration failed";
                    if (response.code() == 422) {
                        errorMsg = "Invalid email format. Please check your email.";
                    } else if (response.code() == 400 || response.code() == 409) {
                        errorMsg = "Email or Username already exists. Try logging in.";
                    } else {
                        try {
                            if (response.errorBody() != null) {
                                String serverMsg = response.errorBody().string();
                                if (serverMsg.contains("already exists")) errorMsg = "Account already exists.";
                                else if (serverMsg.contains("EmailStr")) errorMsg = "Invalid email address.";
                            }
                        } catch (Exception ignored) {}
                    }
                    Toast.makeText(SignupActivity.this, errorMsg, Toast.LENGTH_LONG).show();
                }
            }

            @Override
            public void onFailure(Call<ApiService.UserResponse> call, Throwable t) {
                btnSignup.setEnabled(true);
                btnSignup.setText("SIGN UP");
                String errorMsg = com.simats.olfactory.network.NetworkUtils.getFriendlyErrorMessage(t);
                Toast.makeText(SignupActivity.this, errorMsg, Toast.LENGTH_LONG).show();
            }
        });
    }
}
