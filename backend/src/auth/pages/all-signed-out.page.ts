export function allSignedOutPage(): string {
    return `
        <html>
            <head>
                <title>Signed out everywhere</title>
                <style>
                    body {
                        font-family: 'Inter', system-ui, sans-serif;
                        background-color: #0b1220;
                        color: #e2e8f0;
                        height: 100vh;
                        margin: 0;
                        display: flex;
                        justify-content: center;
                        align-items: center;
                    }
                    .panel {
                        text-align: center;
                        padding: 2.5rem;
                        border-radius: 1.25rem;
                        background: rgba(15, 23, 42, 0.9);
                        border: 1px solid rgba(148, 163, 184, 0.2);
                        box-shadow: 0 20px 40px rgba(2, 6, 23, 0.6);
                    }
                    h1 {
                        margin: 0 0 1rem;
                        font-size: 1.8rem;
                        letter-spacing: -0.02em;
                        color: #38bdf8;
                    }
                    p {
                        margin: 0;
                        color: #cbd5f5;
                        font-size: 1rem;
                    }
                </style>
            </head>
            <body>
                <div class="panel">
                    <h1>All sessions closed</h1>
                    <p>Every active Ratewise session is now signed out.</p>
                </div>
            </body>
        </html>
    `;
}
