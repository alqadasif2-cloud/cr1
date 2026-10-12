package com.cryptowallet.app

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import com.cryptowallet.app.ui.screens.*
import com.cryptowallet.app.ui.theme.CryptoWalletTheme

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            CryptoWalletTheme {
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = MaterialTheme.colorScheme.background
                ) {
                    val navController = rememberNavController()
                    NavHost(navController = navController, startDestination = "home") {
                        composable("home") {
                            HomeScreen(
                                onNavigateToSend = { navController.navigate("send") },
                                onNavigateToReceive = { navController.navigate("receive") },
                                onNavigateToLocked = { navController.navigate("locked") },
                                onNavigateToHistory = { navController.navigate("history") }
                            )
                        }
                        composable("send") {
                            SendScreen(onBack = { navController.popBackStack() })
                        }
                        composable("receive") {
                            ReceiveScreen(onBack = { navController.popBackStack() })
                        }
                        composable("locked") {
                            LockedFundsScreen(onBack = { navController.popBackStack() })
                        }
                    }
                }
            }
        }
    }
}
