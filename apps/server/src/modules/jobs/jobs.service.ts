import { Institution } from '../../models/Institution.js';
import { JobPost, type JobPostDocument } from '../../models/JobPost.js';
import { Enquiry } from '../../models/Enquiry.js';
import { Listing } from '../../models/Listing.js';
import { AppError } from '../../utils/AppError.js';
import { paginatedResult, parsePagination } from '../../utils/helpers.js';
import type { FilterQuery } from 'mongoose';

export interface CreateJobInput {
  title: string;
  description: string;
  category: string;
  location?: string;
  jobType?: 'full-time' | 'part-time' | 'internship' | 'contract' | 'freelance';
  salaryRange?: string;
  applyUrl?: string;
  expiresAt?: string;
}

export type UpdateJobInput = Partial<CreateJobInput> & { status?: 'active' | 'closed' };

export function toJobSummary(doc: JobPostDocument & { institutionName?: string }) {
  return {
    id: String(doc._id),
    institutionId: String(doc.institutionId),
    institutionName: doc.institutionName ?? undefined,
    title: doc.title,
    description: doc.description,
    category: doc.category,
    location: doc.location ?? 'Remote',
    jobType: doc.jobType ?? 'full-time',
    salaryRange: doc.salaryRange ?? undefined,
    applyUrl: doc.applyUrl ?? undefined,
    status: doc.status ?? 'active',
    expiresAt: doc.expiresAt ? new Date(doc.expiresAt).toISOString() : undefined,
    createdAt: (doc as JobPostDocument & { createdAt: Date }).createdAt.toISOString(),
  };
}

async function getInstitutionForUser(userId: string) {
  const institution = await Institution.findOne({ userId });
  if (!institution) throw new AppError('Institution profile not found', 404, 'INSTITUTION_NOT_FOUND');
  return institution;
}

/* ── Institution: create ── */
export async function createJob(userId: string, input: CreateJobInput) {
  const institution = await getInstitutionForUser(userId);
  const job = await JobPost.create({
    institutionId: institution._id,
    ...input,
    expiresAt: input.expiresAt ? new Date(input.expiresAt) : undefined,
  });
  return toJobSummary(job);
}

/* ── Institution: list mine ── */
export async function listMyJobs(userId: string, query: { page?: number; limit?: number; status?: string }) {
  const institution = await getInstitutionForUser(userId);
  const { page, limit, skip } = parsePagination(query);
  const filter: FilterQuery<JobPostDocument> = { institutionId: institution._id };
  if (query.status && query.status !== 'all') filter.status = query.status;

  const [items, total] = await Promise.all([
    JobPost.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    JobPost.countDocuments(filter),
  ]);
  return paginatedResult(items.map((j) => toJobSummary(j)), total, page, limit);
}

/* ── Institution: update ── */
export async function updateJob(userId: string, jobId: string, input: UpdateJobInput) {
  const institution = await getInstitutionForUser(userId);
  const job = await JobPost.findOne({ _id: jobId, institutionId: institution._id });
  if (!job) throw new AppError('Job not found', 404, 'JOB_NOT_FOUND');
  const { expiresAt, ...rest } = input;
  Object.assign(job, rest);
  if (expiresAt !== undefined) job.expiresAt = new Date(expiresAt);
  await job.save();
  return toJobSummary(job);
}

/* ── Institution: delete ── */
export async function deleteJob(userId: string, jobId: string) {
  const institution = await getInstitutionForUser(userId);
  const job = await JobPost.findOneAndDelete({ _id: jobId, institutionId: institution._id });
  if (!job) throw new AppError('Job not found', 404, 'JOB_NOT_FOUND');
  return { deleted: true };
}

/* ── Student: personalised feed based on enquired/bookmarked categories ── */
export async function getStudentJobFeed(
  studentId: string,
  query: { page?: number; limit?: number },
) {
  const { page, limit, skip } = parsePagination(query);

  // Derive the categories the student has engaged with
  const [enquiries, bookmarks] = await Promise.all([
    Enquiry.find({ studentId }).select('listingId').lean(),
    // We look up bookmarks via Bookmark model — import lazily to avoid circular dep
    (async () => {
      const { Bookmark } = await import('../../models/Bookmark.js');
      return Bookmark.find({ studentId }).select('listingId').lean();
    })(),
  ]);

  const listingIds = [
    ...enquiries.map((e) => e.listingId),
    ...bookmarks.map((b) => (b as { listingId: unknown }).listingId),
  ];

  // Deduplicate listing ids and resolve categories
  const listings = listingIds.length
    ? await Listing.find({ _id: { $in: listingIds } }).select('category').lean()
    : [];

  const categories = [...new Set(listings.map((l) => l.category))];

  const now = new Date();
  const filter: FilterQuery<JobPostDocument> = {
    status: 'active',
    $or: [{ expiresAt: { $exists: false } }, { expiresAt: { $gt: now } }],
    ...(categories.length ? { category: { $in: categories } } : {}),
  };

  const [items, total] = await Promise.all([
    JobPost.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    JobPost.countDocuments(filter),
  ]);

  // Attach institution names
  const instIds = [...new Set(items.map((j) => String(j.institutionId)))];
  const institutions = await Institution.find({ _id: { $in: instIds } }).select('name').lean();
  const instMap = new Map(institutions.map((i) => [String(i._id), i.name]));

  const enriched = items.map((j) => toJobSummary(Object.assign(j, { institutionName: instMap.get(String(j.institutionId)) })));
  return { ...paginatedResult(enriched, total, page, limit), categories };
}

/* ── Public: jobs for an institution's public page ── */
export async function getInstitutionPublicJobs(institutionId: string, query: { page?: number; limit?: number }) {
  const { page, limit, skip } = parsePagination(query);
  const now = new Date();
  const filter: FilterQuery<JobPostDocument> = {
    institutionId,
    status: 'active',
    $or: [{ expiresAt: { $exists: false } }, { expiresAt: { $gt: now } }],
  };
  const [items, total] = await Promise.all([
    JobPost.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    JobPost.countDocuments(filter),
  ]);
  return paginatedResult(items.map((j) => toJobSummary(j)), total, page, limit);
}
