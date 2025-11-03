const { ServerClient } = require('postmark');

// Initialize Postmark client
const postmarkClient = new ServerClient(
  process.env.POSTMARK_SERVER_TOKEN || 'POSTMARK_API_TEST'
);

/**
 * Send an email via Postmark
 */
async function sendEmail({
  from = process.env.MAIL_FROM || 'support@capsulepodhotel.com',
  to,
  cc,
  bcc,
  replyTo,
  subject,
  htmlBody,
  textBody,
  tag,
  metadata,
  attachments,
}) {
  try {
    const response = await postmarkClient.sendEmail({
      From: from,
      To: Array.isArray(to) ? to.join(',') : to,
      Cc: cc ? (Array.isArray(cc) ? cc.join(',') : cc) : undefined,
      Bcc: bcc ? (Array.isArray(bcc) ? bcc.join(',') : bcc) : undefined,
      ReplyTo: replyTo,
      Subject: subject,
      HtmlBody: htmlBody,
      TextBody: textBody,
      Tag: tag,
      Metadata: metadata,
      Attachments: attachments,
      TrackOpens: true,
      TrackLinks: 'None', // Disable click tracking for magic links
    });

    return {
      success: true,
      messageId: response.MessageID,
      submittedAt: response.SubmittedAt,
      to: response.To,
    };
  } catch (error) {
    console.error('Postmark send error:', error);
    return {
      success: false,
      error: error.message || 'Failed to send email',
      code: error.code,
    };
  }
}

/**
 * Get server information (for health checks)
 */
async function getServerInfo() {
  try {
    const server = await postmarkClient.getServer();
    return {
      success: true,
      server: {
        id: server.ID,
        name: server.Name,
        color: server.Color,
        smtpApiActivated: server.SmtpApiActivated,
        inboundAddress: server.InboundAddress,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error.message || 'Failed to get server info',
    };
  }
}

module.exports = {
  postmarkClient,
  sendEmail,
  getServerInfo,
};

