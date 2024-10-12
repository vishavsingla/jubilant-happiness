import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

export const driverSignUpController = async (req: Request, res: Response) => {
  try {
    const { name, email, password, licenseNumber, vehicleType, vehicleNumber, phoneNumber } = req.body;

    const existingDriver = await prisma.user.findUnique({ where: { email } });
    if (existingDriver) return res.status(400).json({ message: "Driver already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const newDriver = await prisma.user.create({
      data: {
        name,
        email,
        hashedPassword,
        role: 'DRIVER', // Ensure role is DRIVER
        phoneNumber: phoneNumber, // Add phoneNumber
        Driver: {
          create: {
            licenseNumber,
            vehicleType,
            vehicleNumber,
          },
        },
      },
    });

    return res.status(201).json({ message: "Driver registered", newDriver });
  } catch (error) {
    return res.status(500).json({ message: "Error registering driver", error });
  }
};

export const driverLoginController = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    const driver = await prisma.user.findUnique({ where: { email, role: 'DRIVER' } });
    if (!driver) return res.status(404).json({ message: "Driver not found" });

    const isMatch = await bcrypt.compare(password, driver.hashedPassword);
    if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

    const token = jwt.sign({ id: driver.id, role: driver.role }, process.env.ACCESS_TOKEN_PRIVATE_KEY as string);
    return res.status(200).json({ message: "Driver login successful", token });
  } catch (error) {
    return res.status(500).json({ message: "Error logging in", error });
  }
};