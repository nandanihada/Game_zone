import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import './condition.css';

const App = () => {
  const [termsExpanded, setTermsExpanded] = useState(true);
  const [privacyExpanded, setPrivacyExpanded] = useState(true);

  const [accountExpanded, setAccountExpanded] = useState(true);
  const [conductExpanded, setConductExpanded] = useState(true);
  const [ipExpanded, setIpExpanded] = useState(true);
  const [virtualItemsExpanded, setVirtualItemsExpanded] = useState(true);
  const [terminationExpanded, setTerminationExpanded] = useState(true);

  const [dataCollectionExpanded, setDataCollectionExpanded] = useState(true);
  const [dataUseExpanded, setDataUseExpanded] = useState(true);
  const [dataSharingExpanded, setDataSharingExpanded] = useState(true);
  const [dataProtectionExpanded, setDataProtectionExpanded] = useState(true);
  const [yourRightsExpanded, setYourRightsExpanded] = useState(true);
  const [policyChangesExpanded, setPolicyChangesExpanded] = useState(true);

  const CollapsibleSection = ({ title, children, isExpanded, onToggle, level = 2 }) => {
    const HeadingTag = `h${level}`;

    const headingClasses = {
      2: "collapsible-heading-level-2",
      3: "collapsible-heading-level-3",
    };

    return (
      <div className="collapsible-section">
        <HeadingTag
          className={`collapsible-heading ${headingClasses[level]}`}
          onClick={onToggle}
        >
          {title}
          {isExpanded ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
        </HeadingTag>
        {isExpanded && (
          <div className="collapsible-content">
            {children}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="app-container">
      <div className="content-wrapper">
        <h1 className="main-title">Legal Information</h1>

        {/* Terms and Conditions */}
        <CollapsibleSection
          title="Terms and Conditions"
          isExpanded={termsExpanded}
          onToggle={() => setTermsExpanded(!termsExpanded)}
          level={2}
        >
          <p className="paragraph">
            Welcome to our gaming platform! By accessing or using our services, you agree to be bound by these Terms and Conditions. Please read them carefully.
          </p>

          <CollapsibleSection
            title="1. Account Creation and Usage"
            isExpanded={accountExpanded}
            onToggle={() => setAccountExpanded(!accountExpanded)}
            level={3}
          >
            <ul className="list-item">
              <li>You must be at least 13 years old to create an account.</li>
              <li>You are responsible for maintaining the confidentiality of your account login information.</li>
              <li>You agree not to share your account with others or use another person's account.</li>
              <li>Any activity under your account is your responsibility.</li>
            </ul>
          </CollapsibleSection>

          <CollapsibleSection
            title="2. User Conduct"
            isExpanded={conductExpanded}
            onToggle={() => setConductExpanded(!conductExpanded)}
            level={3}
          >
            <ul className="list-item">
              <li>You agree to use the platform in a lawful manner and not engage in any activity that is harmful, threatening, abusive, or harassing.</li>
              <li>Cheating, hacking, or exploiting game glitches is strictly prohibited and may result in account termination.</li>
              <li>Do not upload or share content that is illegal, offensive, or infringes on intellectual property rights.</li>
            </ul>
          </CollapsibleSection>

          <CollapsibleSection
            title="3. Intellectual Property"
            isExpanded={ipExpanded}
            onToggle={() => setIpExpanded(!ipExpanded)}
            level={3}
          >
            <p className="paragraph">
              All content on this platform, including games, graphics, text, and software, is the property of [Your Company Name] or its licensors and is protected by copyright and other intellectual property laws. You may not reproduce, distribute, or create derivative works without explicit permission.
            </p>
          </CollapsibleSection>

          <CollapsibleSection
            title="4. Virtual Items and Currency"
            isExpanded={virtualItemsExpanded}
            onToggle={() => setVirtualItemsExpanded(!virtualItemsExpanded)}
            level={3}
          >
            <p className="paragraph">
              Virtual items and currency purchased or earned on the platform have no real-world value and cannot be redeemed for cash. They are licensed to you for your personal use within the game and are subject to these Terms and Conditions.
            </p>
          </CollapsibleSection>

          <CollapsibleSection
            title="5. Termination"
            isExpanded={terminationExpanded}
            onToggle={() => setTerminationExpanded(!terminationExpanded)}
            level={3}
          >
            <p className="paragraph">
              We reserve the right to suspend or terminate your account at our sole discretion, without notice, for any violation of these Terms and Conditions or for any other reason.
            </p>
          </CollapsibleSection>
        </CollapsibleSection>

        {/* Privacy Policy */}
        <CollapsibleSection
          title="Privacy Policy"
          isExpanded={privacyExpanded}
          onToggle={() => setPrivacyExpanded(!privacyExpanded)}
          level={2}
        >
          <p className="paragraph">
            Your privacy is important to us. This Privacy Policy explains how we collect, use, disclose, and protect your personal data when you use our gaming platform.
          </p>

          <CollapsibleSection
            title="1. Data Collection Practices"
            isExpanded={dataCollectionExpanded}
            onToggle={() => setDataCollectionExpanded(!dataCollectionExpanded)}
            level={3}
          >
            <p className="paragraph">We collect various types of information to provide and improve our services:</p>
            <ul className="list-item">
              <li><span className="strong-text">Personal Information:</span> When you create an account, we may collect your username, email address, and date of birth. If you make purchases, we collect payment information.</li>
              <li><span className="strong-text">Usage Data:</span> We collect information about how you interact with our platform, including game progress, IP address, device info, etc.</li>
              <li><span className="strong-text">Communication Data:</span> If you contact support, we may collect data to help resolve your issue.</li>
            </ul>
          </CollapsibleSection>

          <CollapsibleSection
            title="2. How We Use Your Data"
            isExpanded={dataUseExpanded}
            onToggle={() => setDataUseExpanded(!dataUseExpanded)}
            level={3}
          >
            <p className="paragraph">We use the data for:</p>
            <ul className="list-item">
              <li>Operating our platform</li>
              <li>Personalized content</li>
              <li>Processing transactions</li>
              <li>Customer support</li>
              <li>Security & fraud prevention</li>
              <li>Legal compliance</li>
            </ul>
          </CollapsibleSection>

          <CollapsibleSection
            title="3. Data Sharing and Disclosure"
            isExpanded={dataSharingExpanded}
            onToggle={() => setDataSharingExpanded(!dataSharingExpanded)}
            level={3}
          >
            <p className="paragraph">We do not sell your personal data. We may share it with:</p>
            <ul className="list-item">
              <li><span className="strong-text">Service Providers:</span> Hosting, payment, analytics vendors.</li>
              <li><span className="strong-text">Legal Requirements:</span> When required by law.</li>
              <li><span className="strong-text">Business Transfers:</span> If we're acquired or merged.</li>
            </ul>
          </CollapsibleSection>

          <CollapsibleSection
            title="4. Data Protection Measures"
            isExpanded={dataProtectionExpanded}
            onToggle={() => setDataProtectionExpanded(!dataProtectionExpanded)}
            level={3}
          >
            <ul className="list-item">
              <li>Encryption (in transit & at rest)</li>
              <li>Secure infrastructure</li>
              <li>Access controls</li>
              <li>Security audits & training</li>
            </ul>
          </CollapsibleSection>

          <CollapsibleSection
            title="5. Your Rights"
            isExpanded={yourRightsExpanded}
            onToggle={() => setYourRightsExpanded(!yourRightsExpanded)}
            level={3}
          >
            <ul className="list-item">
              <li>Access your data</li>
              <li>Request correction or deletion</li>
              <li>Restrict or object to processing</li>
              <li>Data portability</li>
            </ul>
            <p className="paragraph">Contact: [Your Support Email Address]</p>
          </CollapsibleSection>

          <CollapsibleSection
            title="6. Changes to This Policy"
            isExpanded={policyChangesExpanded}
            onToggle={() => setPolicyChangesExpanded(!policyChangesExpanded)}
            level={3}
          >
            <p className="paragraph">
              We may update this policy. Changes will be posted with a new "Last Updated" date.
            </p>
          </CollapsibleSection>
        </CollapsibleSection>

        <p className="last-updated-text">
          Last Updated: July 8, 2025
        </p>
      </div>
    </div>
  );
};

export default App;
