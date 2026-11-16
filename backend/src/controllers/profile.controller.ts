import { Response, NextFunction } from 'express';
import { prisma } from '../config/db';
import { AuthRequest } from '../types';
import { logAudit } from '../utils/auditLogger';

export class ProfileController {
  /**
   * Retrieves the authenticated user's sender profile.
   * Initializes grounded profile for user if not yet created.
   */
  public static async getProfile(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;

      let profile = await prisma.userProfile.findUnique({
        where: { userId },
      });

      if (!profile) {
        const user = await prisma.user.findUnique({ where: { id: userId } });
        profile = await prisma.userProfile.create({
          data: {
            userId,
            fullName: user?.fullName || 'Muhammad Ali',
            professionalTitle: 'Full-Stack Software Engineer',
            location: 'Remote',
            shortBio:
              'Full-stack software engineer specializing in clean web applications, TypeScript/React frontends, Node.js and Java backends, and relational databases.',
            skills: 'TypeScript, JavaScript, React, Node.js, Express, Java, Spring Boot, PostgreSQL, Prisma, Python',
            servicesOffered:
              'Full-stack web application development, React frontend engineering, Node.js/Java REST API architecture, custom software solutions, database modeling',
            portfolioUrl: 'https://github.com/mr-charlie39',
            githubUrl: 'https://github.com/mr-charlie39',
            linkedinUrl: '',
            signature: `Best regards,\n${user?.fullName || 'Muhammad Ali'}\nFull-Stack Software Engineer`,
            writingStyle: 'Direct, concise, professional',
          },
        });
      }

      res.json(profile);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Updates sender profile details
   */
  public static async updateProfile(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const {
        fullName,
        professionalTitle,
        location,
        shortBio,
        skills,
        servicesOffered,
        portfolioUrl,
        linkedinUrl,
        githubUrl,
        signature,
        writingStyle,
      } = req.body;

      const profile = await prisma.userProfile.upsert({
        where: { userId },
        create: {
          userId,
          fullName: fullName?.trim() || req.user!.fullName || 'Muhammad Ali',
          professionalTitle: professionalTitle?.trim(),
          location: location?.trim(),
          shortBio: shortBio?.trim(),
          skills: skills?.trim(),
          servicesOffered: servicesOffered?.trim(),
          portfolioUrl: portfolioUrl?.trim(),
          linkedinUrl: linkedinUrl?.trim(),
          githubUrl: githubUrl?.trim(),
          signature: signature?.trim(),
          writingStyle: writingStyle?.trim() || 'Direct, concise, professional',
        },
        update: {
          fullName: fullName?.trim(),
          professionalTitle: professionalTitle?.trim(),
          location: location?.trim(),
          shortBio: shortBio?.trim(),
          skills: skills?.trim(),
          servicesOffered: servicesOffered?.trim(),
          portfolioUrl: portfolioUrl?.trim(),
          linkedinUrl: linkedinUrl?.trim(),
          githubUrl: githubUrl?.trim(),
          signature: signature?.trim(),
          writingStyle: writingStyle?.trim(),
        },
      });

      // Update full name on user record as well if changed
      if (fullName && fullName.trim()) {
        await prisma.user.update({
          where: { id: userId },
          data: { fullName: fullName.trim() },
        });
      }

      await logAudit({
        actorUserId: userId,
        action: 'PROFILE_UPDATED',
        targetUserId: userId,
        req,
      });

      res.json(profile);
    } catch (error) {
      next(error);
    }
  }
}
