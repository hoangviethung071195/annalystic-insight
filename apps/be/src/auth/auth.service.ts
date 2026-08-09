import { Injectable, ConflictException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../db/prisma.service';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class AuthService {
  private readonly jwtSecret = process.env.JWT_SECRET || 'super-secret-key-12345';

  constructor(private readonly prisma: PrismaService) {}

  async register(email: string, password: string) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await this.prisma.user.create({
      data: {
        email,
        password: hashedPassword,
      },
    });

    // Exclude password from return
    const { password: _, ...result } = user;
    return result;
  }

  async login(email: string, password: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email },
      this.jwtSecret,
      { expiresIn: '7d' },
    );

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
      },
    };
  }

  verifyToken(token: string) {
    try {
      return jwt.verify(token, this.jwtSecret) as { userId: number; email: string };
    } catch {
      return null;
    }
  }
}
