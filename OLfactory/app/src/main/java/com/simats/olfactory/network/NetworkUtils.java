package com.simats.olfactory.network;

import java.net.ConnectException;
import java.net.SocketTimeoutException;
import java.net.UnknownHostException;

public class NetworkUtils {

    /**
     * Parses a Throwable from a network failure and returns a user-friendly error message.
     *
     * @param t The Throwable caught in onFailure
     * @return A user-friendly string explaining the error
     */
    public static String getFriendlyErrorMessage(Throwable t) {
        if (t instanceof ConnectException) {
            return "Cannot reach the server. It may be offline or blocked by a firewall.";
        } else if (t instanceof SocketTimeoutException) {
            return "Connection timed out. The server took too long to respond.";
        } else if (t instanceof UnknownHostException) {
            return "Unknown host. Please check your internet connection or server IP.";
        } else if (t != null && t.getMessage() != null) {
            // General fallback with some cleanup
            String msg = t.getMessage();
            if (msg.contains("failed to connect")) {
                return "Failed to connect to the server. Please check your network connection.";
            }
            return "Network Error: " + msg;
        }
        return "An unknown network error occurred.";
    }
}
