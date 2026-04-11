package com.nizhal.ai

import android.app.Service
import android.content.Intent
import android.graphics.PixelFormat
import android.os.Build
import android.os.IBinder
import android.view.Gravity
import android.view.LayoutInflater
import android.view.MotionEvent
import android.view.View
import android.view.WindowManager
import android.webkit.WebView
import android.webkit.WebViewClient

/**
 * Android Foreground Service designed to hold a floating WebView.
 * This utilizes the SYSTEM_ALERT_WINDOW permission to draw over other apps,
 * enabling the "Companion" mode across the entire device context.
 * 
 * Instructions:
 * 1. Place this inside your generated `gen/android/app/src/main/java/com/nizhal/ai/` path.
 * 2. In your `AndroidManifest.xml`, add:
 *      <uses-permission android:name="android.permission.SYSTEM_ALERT_WINDOW"/>
 *      <uses-permission android:name="android.permission.FOREGROUND_SERVICE"/>
 *      <service android:name=".OverlayService" android:exported="false" />
 */
class OverlayService : Service() {

    private lateinit var windowManager: WindowManager
    private lateinit var floatingView: View
    private lateinit var webView: WebView

    override fun onBind(intent: Intent?): IBinder? {
        return null
    }

    override fun onCreate() {
        super.onCreate()

        // Inflate the floating view layout (You will need a basic res/layout/floating_webview.xml)
        // For simplicity, we create it programmatically here.
        floatingView = View.inflate(this, android.R.layout.activity_list_item, null) // Placeholder
        
        // Define overlay types based on Android Version
        val overlayParamType = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY
        } else {
            WindowManager.LayoutParams.TYPE_PHONE
        }

        val params = WindowManager.LayoutParams(
            WindowManager.LayoutParams.WRAP_CONTENT,
            WindowManager.LayoutParams.WRAP_CONTENT,
            overlayParamType,
            WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE or WindowManager.LayoutParams.FLAG_NOT_TOUCH_MODAL,
            PixelFormat.TRANSLUCENT
        )

        params.gravity = Gravity.TOP or Gravity.START
        params.x = 0
        params.y = 100

        windowManager = getSystemService(WINDOW_SERVICE) as WindowManager
        
        setupFloatingWebView()
        windowManager.addView(webView, params)

        setupDrag(params)
    }

    private fun setupFloatingWebView() {
        webView = WebView(this).apply {
            settings.javaScriptEnabled = true
            settings.domStorageEnabled = true
            settings.mediaPlaybackRequiresUserGesture = false
            setBackgroundColor(0) // Transparent background
            
            // In Tauri, this URL points to the local HTTP server hosting the React App
            // e.g., http://10.0.2.2:1420 for dev, or the internalized tauri://localhost
            loadUrl("http://localhost:1420/")
            
            webViewClient = object : WebViewClient() {
                override fun onPageFinished(view: WebView?, url: String?) {
                    super.onPageFinished(view, url)
                }
            }
        }
    }

    private fun setupDrag(params: WindowManager.LayoutParams) {
        var initialX = 0
        var initialY = 0
        var initialTouchX = 0f
        var initialTouchY = 0f

        webView.setOnTouchListener { view, event ->
            when (event.action) {
                MotionEvent.ACTION_DOWN -> {
                    initialX = params.x
                    initialY = params.y
                    initialTouchX = event.rawX
                    initialTouchY = event.rawY
                    true
                }
                MotionEvent.ACTION_MOVE -> {
                    params.x = initialX + (event.rawX - initialTouchX).toInt()
                    params.y = initialY + (event.rawY - initialTouchY).toInt()
                    windowManager.updateViewLayout(webView, params)
                    true
                }
                else -> false
            }
        }
    }

    override fun onDestroy() {
        super.onDestroy()
        if (::webView.isInitialized) {
            windowManager.removeView(webView)
        }
    }
}
