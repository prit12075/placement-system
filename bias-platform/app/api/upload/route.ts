import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { profileCsv } from "@/lib/profileCsv";

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB

/** POST /api/upload — saves CSV to disk and returns a data profile. */
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get("file") as File | null;

  if (!file) return NextResponse.json({ error: "No file provided." }, { status: 400 });
  if (file.size > MAX_FILE_SIZE)
    return NextResponse.json({ error: "File exceeds 50 MB." }, { status: 413 });
  if (!file.name.endsWith(".csv"))
    return NextResponse.json({ error: "Only CSV files are accepted." }, { status: 415 });

  const uploadDir = path.resolve(process.env.UPLOAD_DIR ?? "./uploads");
  await mkdir(uploadDir, { recursive: true });

  const userId = (session.user as { id: string }).id;
  const safeName = `${userId}_${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
  const filePath = path.join(uploadDir, safeName);

  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(filePath, buffer);

  const profile = await profileCsv(filePath);

  return NextResponse.json({ filePath, profile });
}
