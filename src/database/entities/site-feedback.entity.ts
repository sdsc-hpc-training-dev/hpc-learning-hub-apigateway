import { Column, Entity, Index, PrimaryColumn } from 'typeorm';

export type FoundWhatNeeded = 'yes' | 'partly' | 'no' | 'just_browsing';

@Entity({ name: 'site_feedback' })
@Index('IDX_site_feedback_created_at', ['createdAt'])
export class SiteFeedback {
  @PrimaryColumn('uuid')
  id!: string;

  @Column('timestamptz', { name: 'created_at' })
  createdAt!: Date;

  @Column('integer', { name: 'survey_version' })
  surveyVersion!: number;

  @Column('integer')
  rating!: number;

  @Column('text', { name: 'found_what_needed', nullable: true })
  foundWhatNeeded!: FoundWhatNeeded | null;

  @Column('text', { name: 'worked_well', nullable: true })
  workedWell!: string | null;

  @Column('text', { nullable: true })
  improvements!: string | null;
}
