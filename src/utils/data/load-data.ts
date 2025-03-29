export async function getData() {
  "use cache";
  const data = await fetch("/api/data");
  return data;
}
