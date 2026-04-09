import { auth } from "@/lib/auth"
import { cloudinary } from "@/lib/cloudinary"

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  const formData = await request.formData()
  const file = formData.get("file") as File | null

  if (!file) {
    return Response.json({ error: "No file provided" }, { status: 400 })
  }

  if (!file.type.startsWith("image/")) {
    return Response.json({ error: "File must be an image" }, { status: 400 })
  }

  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)

  const result = await new Promise<{ secure_url: string }>((resolve, reject) => {
    cloudinary.uploader
      .upload_stream(
        {
          folder: "automarket/products",
          resource_type: "image",
        },
        (error, result) => {
          if (error || !result) return reject(error ?? new Error("Upload failed"))
          resolve(result as { secure_url: string })
        }
      )
      .end(buffer)
  })

  return Response.json({ url: result.secure_url })
}
