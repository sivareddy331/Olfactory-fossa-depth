package com.simats.olfactory.network;

import android.util.Log;
import okhttp3.OkHttpClient;
import okhttp3.logging.HttpLoggingInterceptor;
import retrofit2.Retrofit;
import retrofit2.converter.gson.GsonConverterFactory;
import java.util.concurrent.TimeUnit;

public class RetrofitClient {
    // The BASE_URL must not contain any leading or trailing spaces.
    private static final String BASE_URL = "http://10.155.157.77:8080/";
    private static Retrofit retrofit = null;

    public static Retrofit getClient() {
        if (retrofit == null) {
            // Sanitize the URL by trimming to avoid "Invalid URL host" exceptions
            String sanitizedUrl = BASE_URL.trim();
            Log.d("RetrofitClient", "Initializing Retrofit with BASE_URL: " + sanitizedUrl);

            HttpLoggingInterceptor interceptor = new HttpLoggingInterceptor();
            interceptor.setLevel(HttpLoggingInterceptor.Level.BODY);

            OkHttpClient client = new OkHttpClient.Builder()
                    .addInterceptor(interceptor)
                    .connectTimeout(30, TimeUnit.SECONDS)
                    .readTimeout(30, TimeUnit.SECONDS)
                    .writeTimeout(30, TimeUnit.SECONDS)
                    .retryOnConnectionFailure(true)
                    .build();

            retrofit = new Retrofit.Builder()
                    .baseUrl(sanitizedUrl)
                    .addConverterFactory(GsonConverterFactory.create())
                    .client(client)
                    .build();
        }
        return retrofit;
    }

    /** Call this when the server IP changes to force a fresh Retrofit instance. */
    public static void reset() {
        retrofit = null;
    }
}
