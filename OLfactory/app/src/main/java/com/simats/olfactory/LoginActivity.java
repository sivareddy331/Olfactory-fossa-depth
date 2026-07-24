package com.simats.olfactory;

import android.content.Context;
import android.content.Intent;
import android.os.Bundle;
import android.view.View;
import android.view.inputmethod.InputMethodManager;
import android.widget.TextView;
import androidx.annotation.NonNull;
import androidx.appcompat.app.AppCompatActivity;

import com.google.android.material.button.MaterialButton;

import android.widget.EditText;
import android.widget.Toast;
import com.simats.olfactory.network.ApiService;
import com.simats.olfactory.network.RetrofitClient;

import okhttp3.ResponseBody;
import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

import android.widget.ArrayAdapter;
import android.widget.AutoCompleteTextView;
import org.json.JSONObject;
import java.util.ArrayList;
import java.util.Iterator;

public class LoginActivity extends AppCompatActivity {

    private AutoCompleteTextView etEmail;
    private EditText etPassword;
    private MaterialButton btnLogin;
    private JSONObject savedAccounts = new JSONObject();

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_login);

        etEmail = findViewById(R.id.etEmail);
        etPassword = findViewById(R.id.etPassword);
        btnLogin = findViewById(R.id.btnLogin);
        
        TextView tvSignup = findViewById(R.id.tvSignup);
        TextView tvForgotPassword = findViewById(R.id.tvForgotPassword);

        btnLogin.setOnClickListener(v -> {
            hideKeyboard();
            performLogin();
        });

        tvSignup.setOnClickListener(v -> startActivity(new Intent(LoginActivity.this, SignupActivity.class)));
        tvForgotPassword.setOnClickListener(v -> startActivity(new Intent(LoginActivity.this, ForgotPasswordActivity.class)));

        // Setup custom reliable autofill dropdown
        android.content.SharedPreferences prefs = getSharedPreferences("AuthPrefs", MODE_PRIVATE);
        try {
            String savedAccountsStr = prefs.getString("saved_accounts", "{}");
            savedAccounts = new JSONObject(savedAccountsStr);
            ArrayList<String> emails = new ArrayList<>();
            Iterator<String> keys = savedAccounts.keys();
            while (keys.hasNext()) {
                emails.add(keys.next());
            }

            ArrayAdapter<String> adapter = new ArrayAdapter<>(this, android.R.layout.simple_dropdown_item_1line, emails);
            etEmail.setAdapter(adapter);
            
            // Show dropdown when focused
            etEmail.setOnFocusChangeListener((v, hasFocus) -> {
                if (hasFocus && emails.size() > 0) {
                    etEmail.showDropDown();
                }
            });

            // When an email is selected from the dropdown, auto-fill the password
            etEmail.setOnItemClickListener((parent, view, position, id) -> {
                String selectedEmail = (String) parent.getItemAtPosition(position);
                try {
                    String pass = savedAccounts.getString(selectedEmail);
                    etPassword.setText(pass);
                } catch (Exception e) { e.printStackTrace(); }
            });

        } catch (Exception e) { e.printStackTrace(); }
    }

    private void hideKeyboard() {
        View view = this.getCurrentFocus();
        if (view != null) {
            InputMethodManager imm = (InputMethodManager) getSystemService(Context.INPUT_METHOD_SERVICE);
            imm.hideSoftInputFromWindow(view.getWindowToken(), 0);
        }
    }

    private void performLogin() {
        String emailRaw = etEmail.getText().toString().trim();
        String password = etPassword.getText().toString().trim();

        // --- Validation ---
        if (emailRaw.isEmpty()) {
            etEmail.setError("Email is required");
            etEmail.requestFocus();
            return;
        }
        if (password.isEmpty()) {
            etPassword.setError("Password is required");
            etPassword.requestFocus();
            return;
        }

        // Validate email format
        String email = emailRaw.toLowerCase();
        if (!android.util.Patterns.EMAIL_ADDRESS.matcher(email).matches()) {
            etEmail.setError("Please enter a valid email address");
            etEmail.requestFocus();
            return;
        }

        // Minimum password length
        if (password.length() < 6) {
            etPassword.setError("Password must be at least 6 characters");
            etPassword.requestFocus();
            return;
        }

        btnLogin.setEnabled(false);
        btnLogin.setText(R.string.logging_in);

        ApiService apiService = RetrofitClient.getClient().create(ApiService.class);
        ApiService.UserLogin request = new ApiService.UserLogin(email, password);

        apiService.login(request).enqueue(new Callback<ApiService.TokenResponse>() {
            @Override
            public void onResponse(@NonNull Call<ApiService.TokenResponse> call, @NonNull Response<ApiService.TokenResponse> response) {
                btnLogin.setEnabled(true);
                btnLogin.setText(R.string.login_btn_text);

                if (response.isSuccessful() && response.body() != null) {
                    String token = response.body().access_token;
                    String username = email.contains("@") ? email.split("@")[0] : email;

                    android.content.SharedPreferences prefs = getSharedPreferences("AuthPrefs", MODE_PRIVATE);

                    // 1. Save immediate info
                    prefs.edit()
                        .putString("token", token)
                        .putString("username", username)
                        .apply();

                    // 2. Fetch extra info in background
                    apiService.getMe("Bearer " + token).enqueue(new Callback<ApiService.UserResponse>() {
                        @Override
                        public void onResponse(@NonNull Call<ApiService.UserResponse> call2, @NonNull Response<ApiService.UserResponse> r2) {
                            if (r2.isSuccessful() && r2.body() != null) {
                                prefs.edit()
                                    .putString("full_name", r2.body().full_name != null ? r2.body().full_name : r2.body().username)
                                    .putString("username", r2.body().username)
                                    .apply();
                            }
                        }
                        @Override
                        public void onFailure(@NonNull Call<ApiService.UserResponse> call2, @NonNull Throwable t) {}
                    });

                    // 3. Define navigation action
                    Runnable goToDashboard = () -> {
                        Toast.makeText(LoginActivity.this, "Login Successful", Toast.LENGTH_SHORT).show();
                        startActivity(new Intent(LoginActivity.this, DashboardActivity.class));
                        finish();
                    };

                    // 4. Prompt to save credentials and then navigate
                    try {
                        String savedStr = prefs.getString("saved_accounts", "{}");
                        JSONObject saved = new JSONObject(savedStr);
                        if (!saved.has(emailRaw) || !saved.getString(emailRaw).equals(password)) {
                            new androidx.appcompat.app.AlertDialog.Builder(LoginActivity.this)
                                .setTitle("Save Credentials")
                                .setMessage("Would you like to save this email and password for future logins?")
                                .setPositiveButton("Save", (dialog, which) -> {
                                    try {
                                        saved.put(emailRaw, password);
                                        prefs.edit().putString("saved_accounts", saved.toString()).apply();
                                    } catch (Exception e) { e.printStackTrace(); }
                                    goToDashboard.run();
                                })
                                .setNegativeButton("Not Now", (dialog, which) -> goToDashboard.run())
                                .setCancelable(false)
                                .show();
                        } else {
                            goToDashboard.run();
                        }
                    } catch (Exception e) { 
                        e.printStackTrace(); 
                        goToDashboard.run();
                    }
                } else {
                    // Parse the error detail from JSON response
                    String errorMsg = "Login failed";
                    try (ResponseBody errorBody = response.errorBody()) {
                        if (errorBody != null) {
                            String raw = errorBody.string();
                            try {
                                org.json.JSONObject json = new org.json.JSONObject(raw);
                                if (json.has("detail")) {
                                    errorMsg = json.getString("detail");
                                } else {
                                    errorMsg = raw;
                                }
                            } catch (Exception jsonEx) {
                                errorMsg = raw;
                            }
                        }
                    } catch (Exception ignored) {}
                    Toast.makeText(LoginActivity.this, errorMsg, Toast.LENGTH_LONG).show();
                }
            }

            @Override
            public void onFailure(@NonNull Call<ApiService.TokenResponse> call, @NonNull Throwable t) {
                btnLogin.setEnabled(true);
                btnLogin.setText(R.string.login_btn_text);
                String errorMsg = com.simats.olfactory.network.NetworkUtils.getFriendlyErrorMessage(t);
                Toast.makeText(LoginActivity.this, errorMsg, Toast.LENGTH_LONG).show();
            }
        });
    }
}
