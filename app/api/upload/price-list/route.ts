import { handleUpload } from "../_handler";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  return handleUpload(req, "price-list");
}
