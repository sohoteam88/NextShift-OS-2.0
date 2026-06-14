import {
  Target, Users, BarChart3, Zap, FileText, MessageCircle, Mail, CheckCheck,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import type { FunnelBuilderOutput } from '@/modules/ai/services/funnel-builder-service';
import { Section } from '../shared/Section';
import { Field } from '../shared/Field';
import { BulletList } from '../shared/BulletList';
import { CopyButton } from '../shared/CopyButton';
import { avatarLabels, painLabels, benchmarkLabels, gradeColors } from '../../constants/funnel-builder';

export function FunnelResult({ funnel }: { funnel: FunnelBuilderOutput }) {
  return (
    <div className="space-y-3">
      {/* Funnel Summary */}
      <Section title="漏斗总结" icon={<Target className="h-4 w-4" />} defaultOpen>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="漏斗类型" value={funnel.funnelSummary.funnelType} />
          <Field label="选择原因" value={funnel.funnelSummary.reason} />
          <Field label="主要目标" value={funnel.funnelSummary.primaryGoal} />
          <Field label="成交渠道" value={funnel.funnelSummary.closingChannel} />
        </div>
      </Section>

      {/* Customer Avatar */}
      <Section title="目标客户画像" icon={<Users className="h-4 w-4" />} defaultOpen>
        <div className="grid gap-4 sm:grid-cols-2">
          {Object.entries(funnel.customerAvatar).map(([k, v]) => (
            <Field key={k} label={avatarLabels[k] ?? k} value={v} />
          ))}
        </div>
      </Section>

      {/* Pain & Desire Map */}
      <Section title="痛点与渴望地图" icon={<BarChart3 className="h-4 w-4" />}>
        <div className="grid gap-4 sm:grid-cols-2">
          {Object.entries(funnel.painDesireMap).map(([k, v]) => (
            <Field key={k} label={painLabels[k] ?? k} value={v} />
          ))}
        </div>
      </Section>

      {/* Offer Positioning */}
      <Section title="产品定位" icon={<Zap className="h-4 w-4" />}>
        <Field label="定位公式" value={funnel.offerPositioning.formula} />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="是什么" value={funnel.offerPositioning.whatIsIt} />
          <Field label="适合谁" value={funnel.offerPositioning.whoIsItFor} />
          <Field label="解决什么问题" value={funnel.offerPositioning.problemSolved} />
          <Field label="承诺什么结果" value={funnel.offerPositioning.resultPromised} />
          <Field label="有何不同" value={funnel.offerPositioning.whyDifferent} />
          <Field label="为何现在行动" value={funnel.offerPositioning.whyNow} />
        </div>
      </Section>

      {/* Landing Page */}
      <Section title="落地页文案" icon={<FileText className="h-4 w-4" />}>
        <div className="space-y-5">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--color-primary)]">Hero 区块</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="主标题" value={funnel.landingPage.hero.headline} />
              <Field label="副标题" value={funnel.landingPage.hero.subheadline} />
              <Field label="CTA 按钮" value={funnel.landingPage.hero.ctaButton} />
              <Field label="信任句" value={funnel.landingPage.hero.trustLine} />
              <Field label="视觉方向" value={funnel.landingPage.hero.visualDirection} />
            </div>
          </div>
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--color-primary)]">痛点区块</p>
            <Field label="核心问题" value={funnel.landingPage.problem.mainProblem} />
            <BulletList label="痛点清单" items={funnel.landingPage.problem.painBullets} />
            <BulletList label="常见错误" items={funnel.landingPage.problem.mistakes} />
            <Field label="情绪挫败感" value={funnel.landingPage.problem.emotionalFrustration} />
          </div>
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--color-primary)]">渴望区块</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="梦想结果" value={funnel.landingPage.desire.dreamOutcome} />
              <Field label="改变前" value={funnel.landingPage.desire.before} />
              <Field label="改变后" value={funnel.landingPage.desire.after} />
              <Field label="新可能性" value={funnel.landingPage.desire.newPossibility} />
            </div>
          </div>
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--color-primary)]">解决方案区块</p>
            <Field label="系统名称" value={funnel.landingPage.solution.systemName} />
            <Field label="独特机制" value={funnel.landingPage.solution.uniqueMechanism} />
            <BulletList label="运作方式" items={funnel.landingPage.solution.howItWorks} />
            <Field label="为何有效" value={funnel.landingPage.solution.whyItWorks} />
          </div>
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--color-primary)]">引流磁铁</p>
            <Field label="名称" value={funnel.landingPage.leadMagnet.name} />
            <BulletList label="包含内容" items={funnel.landingPage.leadMagnet.whatTheyGet} />
            <Field label="价值说明" value={funnel.landingPage.leadMagnet.whyValuable} />
            <Field label="CTA" value={funnel.landingPage.leadMagnet.cta} />
          </div>
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--color-primary)]">FAQ</p>
            <div className="space-y-3">
              {funnel.landingPage.faq.map((faq, i) => (
                <div key={i} className="rounded-[var(--radius-md)] bg-[var(--color-surface)] p-3">
                  <p className="text-sm font-medium text-[var(--color-text)]">Q: {faq.question}</p>
                  <p className="mt-1 text-sm text-[var(--color-text-muted)]">A: {faq.answer}</p>
                </div>
              ))}
            </div>
          </div>
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--color-primary)]">最终 CTA</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="标题" value={funnel.landingPage.finalCta.headline} />
              <Field label="紧迫感" value={funnel.landingPage.finalCta.urgencyLine} />
              <Field label="按钮" value={funnel.landingPage.finalCta.ctaButton} />
            </div>
            <div className="mt-2 rounded-[var(--radius-md)] bg-green-50 p-3">
              <p className="mb-1 text-xs font-medium text-green-700">WhatsApp 预填消息</p>
              <p className="text-sm text-green-800">{funnel.landingPage.finalCta.whatsappMessage}</p>
              <CopyButton text={funnel.landingPage.finalCta.whatsappMessage} />
            </div>
          </div>
        </div>
      </Section>

      {/* Lead Magnets */}
      <Section title="引流磁铁方案 (5个)" icon={<Zap className="h-4 w-4" />}>
        <div className="space-y-4">
          {funnel.leadMagnets.map((lm, i) => (
            <div key={i} className="rounded-[var(--radius-md)] border border-[var(--color-border)] p-3">
              <p className="mb-2 text-sm font-medium text-[var(--color-text)]">
                {i + 1}. {lm.title}
                <span className="ml-2 rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-700">{lm.format}</span>
              </p>
              <div className="grid gap-2 sm:grid-cols-2 text-sm text-[var(--color-text-muted)]">
                <span>受众: {lm.targetAudience}</span>
                <span>解决: {lm.problemSolved}</span>
                <span className="sm:col-span-2">CTA: {lm.cta}</span>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* WhatsApp System */}
      <Section title="WhatsApp 成交系统" icon={<MessageCircle className="h-4 w-4" />}>
        <div className="space-y-4">
          <div className="rounded-[var(--radius-md)] bg-green-50 p-3">
            <p className="mb-1 text-xs font-medium text-green-700">欢迎消息</p>
            <p className="text-sm text-green-800">{funnel.whatsappSystem.welcomeMessage}</p>
            <CopyButton text={funnel.whatsappSystem.welcomeMessage} />
          </div>
          <BulletList label="资格问题" items={funnel.whatsappSystem.qualificationQuestions} />
          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-[var(--color-text-muted)]">Lead 分级</p>
            <div className="grid gap-2 sm:grid-cols-2">
              {(['a', 'b', 'c', 'd'] as const).map((grade) => (
                <div key={grade} className="rounded-[var(--radius-md)] border border-[var(--color-border)] p-2">
                  <span className={cn('mr-2 rounded px-1.5 py-0.5 text-xs font-bold', gradeColors[grade])}>
                    {grade.toUpperCase()}
                  </span>
                  <span className="text-sm text-[var(--color-text)]">{funnel.whatsappSystem.leadScoring[grade]}</span>
                </div>
              ))}
            </div>
          </div>
          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-[var(--color-text-muted)]">跟进序列</p>
            <div className="space-y-2">
              {funnel.whatsappSystem.followUpSequence.map((item, i) => (
                <div key={i} className="flex items-start gap-3 rounded-[var(--radius-md)] border border-[var(--color-border)] p-3">
                  <span className="shrink-0 rounded-full bg-[var(--color-primary)] px-2 py-0.5 text-xs font-bold text-white">
                    Day {item.day}
                  </span>
                  <div className="flex-1">
                    <p className="text-sm text-[var(--color-text)]">{item.message}</p>
                    <CopyButton text={item.message} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Section>

      {/* Email Sequence */}
      <Section title="邮件序列 (5封)" icon={<Mail className="h-4 w-4" />}>
        <div className="space-y-4">
          {funnel.emailSequence.map((email) => (
            <div key={email.email} className="rounded-[var(--radius-md)] border border-[var(--color-border)] p-4">
              <div className="mb-2 flex items-center gap-2">
                <span className="rounded-full bg-[var(--color-primary)] px-2 py-0.5 text-xs font-bold text-white">Email {email.email}</span>
                <p className="font-medium text-[var(--color-text)]">{email.subject}</p>
                <CopyButton text={email.subject} />
              </div>
              <p className="mb-1 text-xs text-[var(--color-text-muted)]">预览: {email.preview}</p>
              <p className="mb-2 text-sm text-[var(--color-text)]">{email.body}</p>
              <p className="text-sm font-medium text-[var(--color-primary)]">CTA: {email.cta}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* Ad Angles */}
      <Section title="广告角度 (10个)" icon={<BarChart3 className="h-4 w-4" />}>
        <div className="grid gap-3 sm:grid-cols-2">
          {funnel.adAngles.map((ad, i) => (
            <div key={i} className="rounded-[var(--radius-md)] border border-[var(--color-border)] p-3">
              <span className="mb-1 inline-block rounded-full bg-purple-100 px-2 py-0.5 text-xs text-purple-700">{ad.type}</span>
              <p className="text-sm text-[var(--color-text)]">{ad.angle}</p>
              <CopyButton text={ad.angle} />
            </div>
          ))}
        </div>
      </Section>

      {/* Video Hooks */}
      <Section title="短视频开头 (20个)" icon={<Zap className="h-4 w-4" />}>
        <div className="space-y-2">
          {funnel.videoHooks.map((hook, i) => (
            <div key={i} className="flex items-start gap-2 rounded-[var(--radius-md)] bg-[var(--color-surface)] px-3 py-2">
              <span className="shrink-0 text-xs font-bold text-[var(--color-primary)]">{i + 1}.</span>
              <p className="flex-1 text-sm text-[var(--color-text)]">{hook}</p>
              <CopyButton text={hook} />
            </div>
          ))}
        </div>
      </Section>

      {/* Objection Handling */}
      <Section title="异议处理脚本" icon={<MessageCircle className="h-4 w-4" />}>
        <div className="space-y-4">
          {funnel.objectionHandling.map((obj, i) => (
            <div key={i} className="rounded-[var(--radius-md)] border border-[var(--color-border)] p-4">
              <p className="mb-2 font-medium text-[var(--color-text)]">
                异议: <span className="text-red-600">{obj.objection}</span>
              </p>
              <Field label="真正意思" value={obj.realMeaning} />
              <Field label="回应话术" value={obj.response} />
              <div className="mt-2 rounded-[var(--radius-md)] bg-green-50 p-2">
                <p className="text-xs font-medium text-green-700">软引导 CTA</p>
                <p className="text-sm text-green-800">{obj.softCta}</p>
                <CopyButton text={obj.softCta} />
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* Analytics */}
      <Section title="数据追踪计划" icon={<BarChart3 className="h-4 w-4" />}>
        <BulletList label="追踪指标" items={funnel.analyticsTrackingPlan.metrics} />
        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-[var(--color-text-muted)]">参考基准</p>
          <div className="grid gap-2 sm:grid-cols-3">
            {Object.entries(funnel.analyticsTrackingPlan.benchmarks).map(([k, v]) => (
              <div key={k} className="rounded-[var(--radius-md)] border border-[var(--color-border)] p-2 text-center">
                <p className="text-xs text-[var(--color-text-muted)]">{benchmarkLabels[k] ?? k}</p>
                <p className="text-sm font-semibold text-[var(--color-primary)]">{v}</p>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* Optimization Checklist */}
      <Section title="优化清单" icon={<CheckCheck className="h-4 w-4" />}>
        <div className="space-y-2">
          {funnel.optimizationChecklist.map((item, i) => (
            <div key={i} className="flex items-start gap-2 text-sm text-[var(--color-text)]">
              <span className="mt-0.5 h-4 w-4 shrink-0 rounded border border-[var(--color-border)] bg-white" />
              {item}
            </div>
          ))}
        </div>
      </Section>
    </div>
  );
}
