export function verifyYourEmailHtml({
    username,
    link,
    linkExpMin,
}: {
    username: string;
    link: string;
    linkExpMin: number;
}) {
    return `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; color: #333; line-height: 1.6;">
          <h2 style="text-align: center; color: #2563eb;">Welcome to Ratewise, ${username}!</h2>
          <p>Thanks for signing up for Ratewise! Please verify your email address by clicking the button below:</p>
          <p style="text-align: center; margin: 30px 0;">
            <a href="${link}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Verify Email
            </a>
          </p>
          <p>This link will expire in <strong>${linkExpMin} minutes</strong>.</p>          
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">          
        </div>
        `;
}

export function verifyYourEmailPlainText({
    username,
    link,
    linkExpMin,
}: {
    username: string;
    link: string;
    linkExpMin: number;
}) {
    return `
            Hi ${username},
            Thanks for signing up for Ratewise!
            Please verify your email address by clicking the link below:
            ${link}
            This link will expire in ${linkExpMin} minutes.
            — Ratewise
        `;
}
