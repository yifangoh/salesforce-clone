import { notFound } from "next/navigation";
import { OBJECTS, isObjectKey } from "@/lib/objects";
import { getRecord, getRefOptions } from "@/lib/data";
import { RecordForm } from "@/components/record-form";

export default async function EditPage({ params }: { params: Promise<{ object: string; id: string }> }) {
  const { object, id } = await params;
  if (!isObjectKey(object)) notFound();
  const def = OBJECTS[object];
  const [record, refOptions] = await Promise.all([getRecord(def, id), getRefOptions(def)]);
  if (!record) notFound();
  return <RecordForm object={object} id={id} record={record} refOptions={refOptions} />;
}
