export function verifyAccountDeletionHtml({
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
          <h2 style="text-align: center; color: #dc2626;">Account Deletion Request</h2>
          <p>Hi ${username},</p>
          <p>We received a request to delete your Ratewise account. If you want to proceed with deleting your account, please click the button below:</p>
          <p style="text-align: center; margin: 30px 0;">
            <a href="${link}" style="background-color: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Confirm Account Deletion
            </a>
          </p>
          <p><strong>Warning:</strong> This action is permanent and cannot be undone. All your data will be permanently deleted.</p>
          <p>This link will expire in <strong>${linkExpMin} minutes</strong>.</p>
          <p>If you did not request this deletion, please ignore this email and your account will remain active.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">          
        </div>
        `;
}

export function verifyAccountDeletionPlainText({
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
            
            We received a request to delete your Ratewise account.
            
            If you want to proceed with deleting your account, please click the link below:
            ${link}
            
            WARNING: This action is permanent and cannot be undone. All your data will be permanently deleted.
            
            This link will expire in ${linkExpMin} minutes.
            
            If you did not request this deletion, please ignore this email and your account will remain active.
            
            — Ratewise
        `;
}
