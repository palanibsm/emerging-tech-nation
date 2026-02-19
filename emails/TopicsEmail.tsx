import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from '@react-email/components';
import { buildActionUrl } from '@/lib/utils/tokens';
import type { Topic } from '@/types';

interface TopicsEmailProps {
  topics: Topic[];
  token: string;
}

const CATEGORY_COLORS: Record<string, string> = {
  AI: '#6366f1',
  IoT: '#0891b2',
  'AR/VR': '#7c3aed',
};

export default function TopicsEmail({ topics, token }: TopicsEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>5 trending tech topics ready — pick one to write about</Preview>
      <Body style={body}>
        <Container style={container}>
          {/* Header */}
          <Section style={header}>
            <Heading style={heading}>Emerging Tech Nation</Heading>
            <Text style={subheading}>Weekly Topic Selection</Text>
          </Section>

          <Text style={intro}>
            Your AI research agent has found <strong>5 trending topics</strong> for
            this week. Click <strong>Select This Topic</strong> on the one you want
            written. The writer agent will start immediately.
          </Text>

          <Hr style={hr} />

          {/* Topic Cards */}
          {topics.map((topic, index) => (
            <Section key={index} style={card}>
              <Text
                style={{
                  ...badge,
                  backgroundColor: CATEGORY_COLORS[topic.category] ?? '#6b7280',
                }}
              >
                {topic.category}
              </Text>
              <Text style={topicTitle}>{topic.title}</Text>
              <Text style={topicDesc}>{topic.description}</Text>
              <Button
                href={buildActionUrl(token, 'select', index)}
                style={selectBtn}
              >
                Select This Topic →
              </Button>
            </Section>
          ))}

          <Hr style={hr} />

          <Text style={footer}>
            Emerging Tech Nation · Autonomous Blog Agent
            <br />
            If you did not expect this email, simply ignore it.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const body = { backgroundColor: '#f8fafc', fontFamily: 'Arial, sans-serif' };
const container = { maxWidth: '600px', margin: '0 auto', padding: '24px' };
const header = {
  backgroundColor: '#0f172a',
  borderRadius: '8px 8px 0 0',
  padding: '24px',
  textAlign: 'center' as const,
};
const heading = {
  color: '#ffffff',
  fontSize: '24px',
  fontWeight: '700',
  margin: '0 0 4px 0',
};
const subheading = { color: '#94a3b8', fontSize: '14px', margin: '0' };
const intro = {
  color: '#374151',
  fontSize: '15px',
  lineHeight: '1.6',
  margin: '24px 0',
};
const hr = { borderColor: '#e2e8f0', margin: '24px 0' };
const card = {
  backgroundColor: '#ffffff',
  border: '1px solid #e2e8f0',
  borderRadius: '8px',
  padding: '20px',
  marginBottom: '16px',
};
const badge = {
  borderRadius: '4px',
  color: '#ffffff',
  display: 'inline-block',
  fontSize: '11px',
  fontWeight: '700',
  letterSpacing: '0.05em',
  margin: '0 0 8px 0',
  padding: '2px 8px',
  textTransform: 'uppercase' as const,
};
const topicTitle = {
  color: '#0f172a',
  fontSize: '16px',
  fontWeight: '700',
  lineHeight: '1.4',
  margin: '0 0 8px 0',
};
const topicDesc = {
  color: '#6b7280',
  fontSize: '14px',
  lineHeight: '1.6',
  margin: '0 0 16px 0',
};
const selectBtn = {
  backgroundColor: '#0f172a',
  borderRadius: '6px',
  color: '#ffffff',
  display: 'inline-block',
  fontSize: '14px',
  fontWeight: '600',
  padding: '10px 20px',
  textDecoration: 'none',
};
const footer = {
  color: '#9ca3af',
  fontSize: '12px',
  lineHeight: '1.5',
  textAlign: 'center' as const,
  marginTop: '32px',
};
