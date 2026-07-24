package com.simats.olfactory;

import android.content.Intent;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import androidx.appcompat.app.AppCompatActivity;

@SuppressWarnings("deprecation")
public class SplashActivity extends AppCompatActivity {

    private final Handler handler = new Handler(Looper.getMainLooper());
    private final Runnable runnable = () -> {
        if (!isFinishing()) {
            android.content.SharedPreferences prefs = getSharedPreferences("AuthPrefs", MODE_PRIVATE);
            String token = prefs.getString("token", "");
            Intent intent;
            if (!token.isEmpty()) {
                intent = new Intent(SplashActivity.this, DashboardActivity.class);
            } else {
                intent = new Intent(SplashActivity.this, WelcomeActivity.class);
            }
            startActivity(intent);
            overridePendingTransition(android.R.anim.fade_in, android.R.anim.fade_out);
            finish();
        }
    };

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_splash);

        // Reduce delay slightly and use a managed runnable
        handler.postDelayed(runnable, 1500); 
    }

    @Override
    protected void onDestroy() {
        super.onDestroy();
        // Prevent memory leak and starting activity after splash is destroyed
        handler.removeCallbacks(runnable);
    }
}
