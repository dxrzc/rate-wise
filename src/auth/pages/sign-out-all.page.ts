export function signOutAllHtml({
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
          <h2 style="text-align: center; color: #ea580c;">Sign out of all sessions</h2>
          <p>Hi ${username},</p>
          <p>You requested to sign out from every active session on Ratewise. Click the button below to confirm:</p>
          <p style="text-align: center; margin: 30px 0;">
            <a href="${link}" style="background-color: #ea580c; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Sign out everywhere
            </a>
          </p>
          <p>This link will expire in <strong>${linkExpMin} minutes</strong>. If you did not request this, you can ignore this email and your sessions will stay active.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
        </div>
        `;
}

export function signOutAllPlainText({
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
            You requested to sign out from every active session on Ratewise.
            Confirm here: ${link}
            This link will expire in ${linkExpMin} minutes. If you did not request this, ignore this email and nothing will change.
            — Ratewise
        `;
}
