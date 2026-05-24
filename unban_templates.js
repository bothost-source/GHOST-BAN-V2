module.exports = function getUnbanTemplates(phone) {
  return [
    {
      subject: `Urgent Appeal: Unban Request for WhatsApp Number ${phone}`,
      body: `Dear WhatsApp Support Team,\n\nI am writing to formally request the immediate review and reinstatement of my WhatsApp account associated with the number ${phone}, which was suspended in error.\n\nI have always used this account in full compliance with WhatsApp's Terms of Service. The suspension appears to be the result of:\n\n1. False or malicious mass-reports by other users\n2. An automated system error\n3. A misclassification of legitimate personal messages as spam\n4. Account compromise that has since been resolved\n\nThis number is essential for my personal and family communications. I respectfully request that you investigate this matter and restore access to my account at the earliest opportunity.\n\nThank you for your prompt attention.\n\nBest regards,\nAccount Owner`,
    },
    {
      subject: `Account Reinstatement Request - WhatsApp Number ${phone}`,
      body: `To Whom It May Concern,\n\nI am the rightful owner of the WhatsApp account linked to ${phone}. My account has been wrongfully banned and I would like to formally request its reinstatement.\n\nI have not violated any of WhatsApp's policies:\n- I do not send unsolicited or bulk messages\n- I do not engage in harassment of any kind\n- I do not share prohibited or harmful content\n- I use the platform exclusively for personal communication\n\nKindly review my case and restore my account so that I may continue communicating with my friends and family.\n\nSincerely,\nLong-Time WhatsApp User`,
    },
    {
      subject: `Wrongful Ban Appeal: Number ${phone} - Please Review`,
      body: `Dear WhatsApp Appeals Team,\n\nI am submitting this appeal regarding the wrongful suspension of WhatsApp number ${phone}.\n\nThe ban is unjustified for the following reasons:\n\n- The account is used solely for legitimate personal communication\n- I have never received prior warnings or strikes\n- Any reports against me appear to be retaliatory or false\n- I rely on WhatsApp for daily contact with family abroad\n\nPlease conduct a thorough review and lift the ban so that I may regain access to my account.\n\nRegards,\nWrongfully Banned User`,
    },
    {
      subject: `Account Recovery Request: WhatsApp ${phone}`,
      body: `Dear WhatsApp Recovery Team,\n\nI am writing to request the recovery and reinstatement of my WhatsApp account ${phone}, which has been suspended in what I believe is a clear misunderstanding.\n\nMy account history reflects:\n1. Years of normal, policy-compliant use\n2. Verified ownership of this phone number\n3. No history of prior suspensions or warnings\n4. Use only with personal contacts and known business relationships\n\nI kindly ask you to investigate the matter, restore my access, and protect honest users like myself from automated mistakes.\n\nThank you,\nVerified Account Owner`,
    },
    {
      subject: `Appeal Against False Reports - Number ${phone}`,
      body: `Dear Support,\n\nI wish to appeal the suspension of WhatsApp number ${phone}, which I believe was triggered by false and coordinated reports.\n\nDetails of the appeal:\n- I have evidence that my account is being targeted by a coordinated reporting group\n- I have never engaged in spam, harassment, or prohibited behavior\n- I am the original and only owner of this phone number\n- The suspension is causing significant disruption to my personal life\n\nPlease review my account history and lift the ban at your earliest convenience.\n\nThank you for your help,\nFalsely Reported User`,
    },
    {
      subject: `Business Account Unban Request - ${phone}`,
      body: `Dear WhatsApp Business Support,\n\nI am writing to request the urgent unbanning of the WhatsApp Business account associated with ${phone}.\n\nThis account is critical for my business operations:\n- Customer support and order confirmations\n- Communication with verified clients and suppliers\n- Compliance with WhatsApp Business Policy at all times\n- Significant revenue depends on continued access\n\nThe ban appears to be a mistake. Please investigate and restore my account so I can continue serving my customers.\n\nBest regards,\nSmall Business Owner`,
    },
    {
      subject: `Reinstatement Appeal: Account ${phone} - No Policy Violation`,
      body: `Dear WhatsApp Compliance Team,\n\nThis is a formal appeal regarding the suspension of WhatsApp number ${phone}, which I believe was applied without a valid policy violation.\n\nFacts of my case:\n1. No automated or bot-like messaging has ever taken place from this number\n2. No spam has been distributed to contacts or groups\n3. No prohibited content has been shared\n4. No manipulation or abuse of platform features has occurred\n\nI request that this account be reviewed by a human moderator and reinstated promptly.\n\nThank you,\nCompliant User`,
    },
    {
      subject: `Immediate Unban Request for ${phone}`,
      body: `Dear WhatsApp Team,\n\nI am requesting an immediate review and removal of the ban placed on the WhatsApp number ${phone}.\n\nReasons for appeal:\n- The ban appears to be the result of automated false-positives\n- I have never received any prior warnings\n- Multiple legitimate contacts can vouch for my normal usage\n- I depend on this number for emergency family communication\n\nPlease prioritize this case and restore access without further delay.\n\nRegards,\nAffected Account Owner`,
    },
    {
      subject: `Family Account Appeal - Number ${phone}`,
      body: `Dear WhatsApp Safety Team,\n\nI am writing with urgency about the suspension of WhatsApp number ${phone}, which is my family's primary means of staying in touch.\n\nThis account is used to:\n- Coordinate with elderly parents living abroad\n- Stay connected with children attending school overseas\n- Share family photos and important updates\n- Coordinate medical appointments and emergencies\n\nThe wrongful ban has caused real hardship. Please investigate immediately and restore access so my family can resume communication.\n\nThank you,\nConcerned Family Member`,
    },
    {
      subject: `Repeated Appeal for ${phone} - Please Reinstate`,
      body: `Dear WhatsApp Support,\n\nThis is a follow-up appeal regarding the WhatsApp number ${phone}. Despite previous appeals, my account remains suspended without explanation.\n\nKey points:\n- I have submitted multiple appeals with no human response\n- I have been a compliant user for many years\n- The original ban appears to have been triggered in error\n- I have no other way to reach my contacts\n\nI strongly urge a senior reviewer to take a personal look at my case and restore my account.\n\nThank you for finally addressing this matter.\n\nBest regards,\nPersistent Appellant`,
    },
    {
      subject: `Verified Identity Appeal: ${phone}`,
      body: `Dear WhatsApp Trust & Safety Team,\n\nI am writing to confirm my identity and request the reinstatement of the WhatsApp account on ${phone}.\n\nI can confirm that:\n- I am the verified owner and SIM holder of this number\n- I have not engaged in identity theft or impersonation\n- I have never used unauthorized modifications of WhatsApp\n- I have always used the official WhatsApp application\n\nI request immediate reinstatement of my account pending any further verification you may require.\n\nRespectfully,\nVerified User`,
    },
    {
      subject: `Mobile Banking User Appeal - WhatsApp Number ${phone}`,
      body: `Dear WhatsApp Support,\n\nI am urgently appealing the suspension of WhatsApp number ${phone}, which is essential for my financial and banking communications.\n\nThis account is used for:\n- Two-factor authentication codes from my bank\n- Coordination with financial advisors\n- Notifications from legitimate businesses\n- Emergency family financial coordination\n\nThe wrongful ban is preventing me from accessing essential services. Please reinstate my account at the earliest opportunity.\n\nSincerely,\nResponsible Account Owner`,
    },
    {
      subject: `Group Admin Appeal - ${phone}`,
      body: `Dear WhatsApp Moderation Team,\n\nI wish to appeal the wrongful suspension of WhatsApp number ${phone}, which is the admin account for several legitimate community groups.\n\nMy responsibilities include:\n- Moderating community groups according to WhatsApp guidelines\n- Removing genuinely abusive members\n- Coordinating events for local community organizations\n- Maintaining a safe environment for all members\n\nThe suspension appears to be retaliation by removed members. Please review and lift the ban so I can resume my volunteer moderation work.\n\nThank you,\nCommunity Group Admin`,
    },
    {
      subject: `Appeal Against Erroneous Ban - Number ${phone}`,
      body: `Dear WhatsApp Security & Safety Team,\n\nI am respectfully appealing the suspension of WhatsApp number ${phone}, which I believe was applied in error.\n\nMy account history shows:\n- Years of consistent, normal usage patterns\n- No prior warnings or violations\n- Verified phone number ownership\n- Use of only the official WhatsApp application\n\nThis ban is causing significant disruption. Please review the case promptly and restore my access.\n\nUrgently,\nWrongfully Banned User`,
    },
    {
      subject: `Medical Coordination Appeal - WhatsApp ${phone}`,
      body: `Dear WhatsApp Support Team,\n\nI am writing to appeal the suspension of WhatsApp number ${phone}, which is critical for ongoing medical coordination.\n\nThis account is used for:\n- Communication with doctors and medical professionals\n- Coordinating care for elderly relatives\n- Receiving important health updates\n- Emergency contact for medical situations\n\nThe ban is endangering important health-related communications. Please reinstate my account as a matter of urgency.\n\nConcerned Patient/Caregiver`,
    },
    {
      subject: `Educational Use Appeal - Account ${phone}`,
      body: `Dear WhatsApp Content Policy Team,\n\nI am appealing the suspension of WhatsApp number ${phone}, which is used primarily for educational purposes.\n\nMy account is used for:\n- Communication with students and parents\n- Sharing legitimate educational materials\n- Coordinating school activities and assignments\n- Maintaining contact with academic colleagues\n\nThis ban is interfering with my professional educational duties. Kindly review and reinstate my access promptly.\n\nThank you,\nEducator`,
    },
    {
      subject: `Long-Term User Appeal - WhatsApp Number ${phone}`,
      body: `Dear WhatsApp Trust & Safety,\n\nI am appealing the suspension of WhatsApp number ${phone}, which I have used responsibly for many years.\n\nMy long-term account history includes:\n- Years of compliant, peaceful use\n- A clean record with no prior strikes\n- Verified personal contacts only\n- Standard use of official WhatsApp features\n\nThe sudden ban is inconsistent with my actual usage. Please investigate and restore my long-standing account.\n\nBest regards,\nLoyal WhatsApp User`,
    },
    {
      subject: `Personal Communication Appeal - ${phone}`,
      body: `Dear WhatsApp Support Team,\n\nI am submitting an appeal for the WhatsApp number ${phone}, which has been wrongfully suspended.\n\nI use this account exclusively for:\n- Personal conversations with friends and family\n- Coordinating with a small circle of known contacts\n- Sharing personal photos and updates\n- Voice and video calls with loved ones\n\nThis is a personal account with no commercial or large-scale messaging. Please reinstate it without further delay.\n\nSincerely,\nPersonal User`,
    },
    {
      subject: `Account Compromise Resolved - Please Unban ${phone}`,
      body: `Dear WhatsApp Security Team,\n\nI am writing about the WhatsApp number ${phone}, which was suspended after my account was briefly compromised.\n\nI have since:\n- Regained full control of my phone number\n- Enabled two-step verification\n- Updated all related security settings\n- Verified there are no remaining unauthorized sessions\n\nThe original cause of any policy violations has been fully resolved. Please review my case and restore my account.\n\nThank you,\nRecovered Account Owner`,
    },
    {
      subject: `Verification Code Issue Appeal - Number ${phone}`,
      body: `Dear WhatsApp Verification Team,\n\nI am appealing the suspension of WhatsApp number ${phone}, which appears to be related to a verification process issue.\n\nClarification:\n- I have never shared my verification codes with anyone\n- I have never been impersonated or used by another person\n- I have always used the official WhatsApp application\n- My phone number ownership is fully verified with my carrier\n\nPlease review the verification logs and restore my account.\n\nBest regards,\nVerified Phone Owner`,
    },
    {
      subject: `Mistaken Spam Classification Appeal - WhatsApp ${phone}`,
      body: `Dear WhatsApp Fraud Prevention Team,\n\nI am appealing the suspension of WhatsApp number ${phone}, which appears to have been mistakenly classified as a spam or fraud account.\n\nThe truth is:\n- I send normal, individual messages to known contacts\n- I have never run any kind of investment or fraud scheme\n- I have never made unsolicited financial requests\n- I have never solicited personal information from anyone\n\nPlease review my message patterns and restore my account.\n\nRegards,\nMisclassified User`,
    },
    {
      subject: `Legitimate Commerce Appeal - ${phone}`,
      body: `Dear WhatsApp Commerce Policy Team,\n\nI am writing to appeal the suspension of WhatsApp number ${phone}, used for fully legitimate small-scale commerce.\n\nMy commercial activity is limited to:\n- Selling authentic, properly sourced goods\n- Being transparent about pricing and origin with customers\n- Operating in line with WhatsApp Business policies\n- Respecting intellectual property at all times\n\nPlease reinstate this account so I can continue serving my honest customers.\n\nSincerely,\nLegitimate Small Vendor`,
    },
    {
      subject: `Appeal Against False Trafficking Allegations - Number ${phone}`,
      body: `Dear WhatsApp Safety Team,\n\nI am filing an urgent appeal regarding WhatsApp number ${phone}, which has been suspended under false suspicion of illegal activity.\n\nClear facts:\n- I am not involved in any form of trafficking or illegal recruitment\n- All my contacts are verified personal acquaintances\n- I have nothing to hide and welcome a thorough review\n- I am a law-abiding citizen with no related criminal record\n\nThis serious mischaracterization must be corrected. Please review and reinstate my account.\n\nUrgently,\nFalsely Accused User`,
    },
    {
      subject: `Targeted Harassment Victim Appeal - ${phone}`,
      body: `Dear WhatsApp Anti-Harassment Team,\n\nI am appealing the suspension of WhatsApp number ${phone}. I believe my account was targeted by a coordinated false-reporting campaign run against me, the actual victim.\n\nDetails:\n- A group of individuals has been harassing and falsely reporting me\n- They use multiple accounts to amplify their false reports\n- I am the actual victim, not the perpetrator\n- I have done nothing to violate WhatsApp policies\n\nPlease investigate and reinstate my account to protect a genuine victim of harassment.\n\nThank you,\nTargeted Harassment Victim`,
    },
    {
      subject: `Privacy-Conscious User Appeal - WhatsApp ${phone}`,
      body: `Dear WhatsApp Privacy Team,\n\nI am appealing the suspension of WhatsApp number ${phone}. I am a privacy-conscious user who has never engaged in unauthorized data collection.\n\nMy practices include:\n- Never sending fake surveys or harvesting forms\n- Never sharing suspicious links\n- Never collecting contacts or messages without consent\n- Never selling or transferring any data to third parties\n\nThe ban appears to be a misclassification. Please review and restore my account.\n\nBest regards,\nPrivacy-Conscious Citizen`,
    },
    {
      subject: `Mistaken Extremism Flag - Account ${phone}`,
      body: `Dear WhatsApp Content Review Team,\n\nI am filing an urgent appeal about WhatsApp number ${phone}, which has been wrongly flagged for extremist content.\n\nThe truth is:\n- I have never shared extremist propaganda\n- I have never glorified violence or terror\n- I have never been involved with extremist groups\n- I have only forwarded mainstream news and personal messages\n\nThis is a serious mistake that must be corrected. Please reinstate my account without delay.\n\nUrgently submitted,\nFalsely Flagged User`,
    },
    {
      subject: `Innocent Romance Misunderstanding - Number ${phone}`,
      body: `Dear WhatsApp Trust & Safety Team,\n\nI am appealing the suspension of WhatsApp number ${phone}, which appears to have been misclassified due to a personal misunderstanding.\n\nThe facts:\n- I have never run any romance scam\n- All my conversations have been honest and consensual\n- I have never used stolen photos or false identities\n- I have never solicited money under false pretenses\n\nPlease review my case fairly and restore my account.\n\nSincerely,\nFalsely Accused User`,
    },
    {
      subject: `Reporting System Misuse Victim - Account ${phone}`,
      body: `Dear WhatsApp Platform Integrity Team,\n\nI am appealing the suspension of WhatsApp number ${phone}. I am a victim of report-system abuse, not a perpetrator.\n\nWhat actually happened:\n- A group of users coordinated false reports against my account\n- They used multiple sock-puppet accounts to amplify their false claims\n- I have done nothing to deserve a suspension\n- I am being silenced by abusers of your reporting tools\n\nPlease investigate the integrity of the reports against me and restore my account.\n\nThank you,\nReport-Abuse Victim`,
    },
    {
      subject: `No Malware Activity - Appeal for WhatsApp ${phone}`,
      body: `Dear WhatsApp Cybersecurity Team,\n\nI am urgently appealing the suspension of WhatsApp number ${phone}, which has been wrongly associated with malware activity.\n\nThe truth:\n- I have never knowingly sent any malicious files\n- I have never shared malicious links\n- My device has been scanned and is clean\n- Any suspicious files were unknowingly forwarded once and immediately deleted\n\nI take security very seriously. Please review and restore my account.\n\nUrgently,\nSecurity-Conscious User`,
    },
    {
      subject: `Final Reinstatement Plea - WhatsApp Number ${phone}`,
      body: `Dear WhatsApp Senior Enforcement Team,\n\nThis letter serves as a final reinstatement plea regarding the WhatsApp number ${phone}, which has been suspended despite my repeated appeals.\n\nDespite previous appeals, my account remains banned without any clear justification:\n- I have no documented violations on record\n- I have provided full identity verification\n- I have cooperated with every step of the appeal process\n- The ban continues to harm me and my contacts\n\nI respectfully request that a senior human reviewer personally examine this case and reinstate the account permanently.\n\nFinal Plea,\nLong-Suffering Account Owner`,
    },
  ];
};
