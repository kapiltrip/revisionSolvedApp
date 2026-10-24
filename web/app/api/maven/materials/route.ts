const loaders: Record<string, () => Promise<{ default: unknown }>> = {
  "1": () => import("@/content/maven/assignment-01.json"),
  "2": () => import("@/content/maven/assignment-02.json"),
  "3": () => import("@/content/maven/assignment-03.json"),
  "4": () => import("@/content/maven/assignment-04.json"),
  "5": () => import("@/content/maven/assignment-05.json"),
};

export async function GET(request: Request) {
  const number = new URL(request.url).searchParams.get("assignment") ?? "";
  if (!loaders[number])
    return Response.json(
      { error: "The original material for this assignment has not been imported." },
      { status: 404 },
    );
  return Response.json((await loaders[number]()).default);
}
