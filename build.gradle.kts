import org.gradle.api.GradleException

plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
}

val releaseRequested = gradle.startParameter.taskNames.any {
    it.contains("Release", ignoreCase = true)
}

fun requiredSigningEnv(name: String): String =
    System.getenv(name)?.takeIf { it.isNotBlank() }
        ?: throw GradleException("$name is required for Bridge release signing")

android {
    namespace = "com.segeranjiwa.qrisbridge"
    compileSdk = 35

    defaultConfig {
        applicationId = "com.segeranjiwa.qrisbridge"
        minSdk = 26
        targetSdk = 35
        versionCode = 2
        versionName = "0.1.1-beta"
        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
    }

    signingConfigs {
        if (releaseRequested) {
            create("bridgeRelease") {
                storeFile = file(requiredSigningEnv("BRIDGE_KEYSTORE_PATH"))
                storePassword = requiredSigningEnv("BRIDGE_KEYSTORE_PASSWORD")
                keyAlias = requiredSigningEnv("BRIDGE_KEY_ALIAS")
                keyPassword = requiredSigningEnv("BRIDGE_KEY_PASSWORD")
            }
        }
    }

    buildTypes {
        release {
            isMinifyEnabled = false
            isDebuggable = false
            if (releaseRequested) {
                signingConfig = signingConfigs.getByName("bridgeRelease")
            }
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
    kotlinOptions { jvmTarget = "17" }
}

dependencies {
    testImplementation("junit:junit:4.13.2")
}
