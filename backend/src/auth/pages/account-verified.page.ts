export function accountVerifiedPage(): string {
    return `
        <html>
            <head>
                <title>Account Verified</title>
                <style>
                    body {
                        font-family: Arial, sans-serif;
                        background-color: #f8fafc;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        height: 100vh;
                        margin: 0;
                    }
                    .container {
                        text-align: center;
                        background: white;
                        padding: 2rem 3rem;
                        border-radius: 16px;
                        box-shadow: 0 4px 20px rgba(0,0,0,0.1);
                    }
                    h1 {
                        color: #16a34a;
                    }
                    p {
                        color: #374151;
                        font-size: 1rem;
                        margin-top: 1rem;
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <h1>🎉 Account Verified!</h1>
                    <p>You account has been upgraded</p>
                </div>
            </body>
        </html>
    `;
}
