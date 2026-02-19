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
import type { DraftPost } from '@/types';

interface DraftEmailProps {
  draft: DraftPost;
  token: string;
}

function estimateReadTime(html: string): number {
  const text = html.replace(/<[^>]+>/g, ' ');
  return Math.ceil(text.trim().split(/\s+/).length / 200);
}

function wordCount(html: string): number {
  return html.replace(/<[^>]+>/g, ' ').trim().split(/\s+/).length;
}

export default function DraftEmail({ draft, token }: DraftEmailProps) {
  const readTime = estimateReadTime(draft.content);
  const words = wordCount(draft.content);
  const previewUrl = `${process.env.SITE_URL}/draft-preview/${token}`;
  const approveUrl = buildActionUrl(token, 'approve');

  return (
    <Html>
      <Head />
      <Preview>Draft ready for review: {draft.title}</Preview>
      <Body style={body}>
        <Container style={container}>
          {/* Header */}
          <Section style={header}>
            <Heading style={heading}>Draft Ready for Review</Heading>
            <Text style={subheading}>Emerging Tech Nation · Blog Agent</Text>
          </Section>

          {/* Post metadata */}
          <Section style={metaCard}>
            <Text style={postTitle}>{draft.title}</Text>
            <Text style={excerpt}>{draft.excerpt}</Text>

            <Section style={metaRow}>
              <Text style={metaLabel}>Read time</Text>
              <Text style={metaValue}>{readTime} min</Text>
              <Text style={metaLabel}>Words</Text>
              <Text style={metaValue}>~{words}</Text>
              <Text style={metaLabel}>Tags</Text>
              <Text style={metaValue}>{draft.tags.join(', ')}</Text>
            </Section>
          </Section>

          {/* Action Buttons */}
          <Section style={buttonRow}>
            <Button href={previewUrl} style={previewBtn}>
              Preview Full Draft
            </Button>
            <Button href={approveUrl} style={approveBtn}>
              Approve &amp; Publish
            </Button>
          </Section>

          <Hr style={hr} />

          <Text style={note}>
            <strong>When you approve</strong>: The post will be published immediately
            to emergingtechnation.com and you will receive a confirmation with the live URL.
          </Text>
          <Text style={note}>
            <strong>Want changes?</strong>: Reply to this email with your feedback.
          </Text>

          <Hr style={hr} />

          <Text style={footer}>Emerging Tech Nation · Autonomous Blog Agent</Text>
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
  fontSize: '22px',
  fontWeight: '700',
  margin: '0 0 4px 0',
};
const subheading = { color: '#94a3b8', fontSize: '13px', margin: '0' };
const metaCard = {
  backgroundColor: '#ffffff',
  border: '1px solid #e2e8f0',
  borderRadius: '8px',
  padding: '24px',
  margin: '24px 0',
};
const postTitle = {
  color: '#0f172a',
  fontSize: '20px',
  fontWeight: '700',
  lineHeight: '1.3',
  margin: '0 0 12px 0',
};
const excerpt = {
  color: '#4b5563',
  fontSize: '15px',
  lineHeight: '1.6',
  margin: '0 0 16px 0',
};
const metaRow = { display: 'flex' as const, gap: '24px' };
const metaLabel = {
  color: '#9ca3af',
  fontSize: '11px',
  fontWeight: '600',
  letterSpacing: '0.05em',
  margin: '0 0 2px 0',
  textTransform: 'uppercase' as const,
};
const metaValue = {
  color: '#374151',
  fontSize: '14px',
  fontWeight: '600',
  margin: '0',
};
const buttonRow = { textAlign: 'center' as const, margin: '24px 0' };
const previewBtn = {
  backgroundColor: '#ffffff',
  border: '2px solid #0f172a',
  borderRadius: '6px',
  color: '#0f172a',
  display: 'inline-block',
  fontSize: '14px',
  fontWeight: '600',
  margin: '0 8px 12px 8px',
  padding: '10px 20px',
  textDecoration: 'none',
};
const approveBtn = {
  backgroundColor: '#16a34a',
  borderRadius: '6px',
  color: '#ffffff',
  display: 'inline-block',
  fontSize: '14px',
  fontWeight: '600',
  margin: '0 8px',
  padding: '10px 24px',
  textDecoration: 'none',
};
const hr = { borderColor: '#e2e8f0', margin: '24px 0' };
const note = {
  color: '#4b5563',
  fontSize: '14px',
  lineHeight: '1.6',
  margin: '0 0 16px 0',
};
const footer = {
  color: '#9ca3af',
  fontSize: '12px',
  textAlign: 'center' as const,
  margin: '0',
};
