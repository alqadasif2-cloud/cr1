package com.cryptowallet.app.model

enum class Currency {
    BTC, ETH, USDT
}

data class Balance(
    val available: Double = 0.0,
    val locked: Double = 0.0
) {
    val total: Double get() = available + locked
}

data class Wallet(
    val id: String = "",
    val userId: String = "",
    val address: String = "", // Starts with 0x followed by 40 hex chars
    val receiveCode: String = "",
    val balances: Map<String, Balance> = mapOf(
        "BTC" to Balance(0.05, 0.0),
        "ETH" to Balance(2.50, 0.0),
        "USDT" to Balance(1500.0, 0.0)
    ),
    val createdAt: Long = System.currentTimeMillis()
)

data class Transaction(
    val id: String = "",
    val senderUserId: String = "",
    val recipientUserId: String = "",
    val senderAddress: String = "",
    val recipientAddress: String = "",
    val senderName: String = "",
    val recipientName: String = "",
    val currency: String = "USDT",
    val amount: Double = 0.0,
    val lockDurationSeconds: Long = 0L,
    val createdAt: Long = System.currentTimeMillis(),
    val unlockAt: Long? = null,
    val unlockedAt: Long? = null,
    val status: String = "COMPLETED", // LOCKED, COMPLETED, FAILED, REJECTED
    val note: String = "",
    val txHash: String = ""
)

data class LockOption(
    val labelAr: String,
    val labelEn: String,
    val seconds: Long
)
