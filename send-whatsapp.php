<?php
if ($_SERVER['REQUEST_METHOD'] == 'POST') {
    $name = $_POST['name'];
    $email = $_POST['email'];
    $subject = $_POST['subject'];
    $message = $_POST['message'];

    // WhatsApp Cloud API details
    $phone_number_id = "797495393444414"; // From Meta Dashboard
    $access_token = "EAAaxfOXBi0YBPVIiBv2PD2r5W5TGjZBCeH1aZBCg9rgrQAIZBtSf0FdE2Ly6QDXATGHEey3ZA3xQElW2qSvz8UFRxzlOZAZB64xdkZAN6mnJT5lUBD9o0aHDfcj5yM6MwPBb8AjndnJ38CZCCZAXFWaW0kyBG05IWs20kJg9Nryiw1IlmvX1fyALH4kTUlDODQt0uIiUqF75z0N84OEdU46jvIJc7LjM77ajwzV7vccdA1lsc7QZDZD";       // From Meta Graph API
    $to = "919972966961"; // Your personal WhatsApp number with country code

    $text = "📩 New Contact Form Submission\n\n"
          . "👤 Name: $name\n"
          . "📧 Email: $email\n"
          . "📝 Subject: $subject\n"
          . "💬 Message: $message";

    $url = "https://graph.facebook.com/v20.0/$phone_number_id/messages";

    $data = [
        "messaging_product" => "whatsapp",
        "to" => $to,
        "type" => "text",
        "text" => ["body" => $text]
    ];

    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        "Authorization: Bearer $access_token",
        "Content-Type: application/json"
    ]);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);

    $response = curl_exec($ch);
    curl_close($ch);

    echo "✅ Message sent to WhatsApp!";
}
?>
