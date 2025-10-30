import React from "react";
import { Dialog } from "@headlessui/react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { X, Image as ImageIcon } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";

const schema = z.object({
  name: z.string().min(1, "Category name is required"),
  slug: z.string().min(1, "Slug is required"),
  description: z.string().optional(),
  isActive: z.boolean(),
  imageFile: z.any().optional(), // File | undefined
});

export type EditCategoryFormData = z.infer<typeof schema>;

export interface EditCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: EditCategoryFormData) => void;
  initial: {
    name: string;
    slug: string;
    description?: string;
    isActive: boolean;
    imageUrl?: string;
  };
}

const ToggleBtn: React.FC<{ checked: boolean; onChange: (v: boolean) => void; label?: string }> = ({
  checked, onChange, label = "Status",
}) => (
  <div className="flex items-center justify-between">
    <span className="text-sm font-medium text-gray-700">{label}</span>
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${checked ? "bg-green-500" : "bg-gray-300"}`}
      aria-pressed={checked}
    >
      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${checked ? "translate-x-6" : "translate-x-1"}`} />
    </button>
  </div>
);

const slugify = (val: string) =>
  val.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-");

const EditCategoryModal: React.FC<EditCategoryModalProps> = ({ isOpen, onClose, onSave, initial }) => {
  const {
    register, handleSubmit, setValue, watch, reset,
    formState: { errors },
  } = useForm<EditCategoryFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: initial.name,
      slug: initial.slug,
      description: initial.description ?? "",
      isActive: initial.isActive,
      imageFile: undefined,
    },
  });

  const [localPreviewUrl, setLocalPreviewUrl] = React.useState<string | null>(null);

  React.useEffect(() => {
    reset({
      name: initial.name,
      slug: initial.slug,
      description: initial.description ?? "",
      isActive: initial.isActive,
      imageFile: undefined,
    });
    if (localPreviewUrl) {
      URL.revokeObjectURL(localPreviewUrl);
      setLocalPreviewUrl(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initial, isOpen]);

  const nameVal = watch("name");
  const slugVal = watch("slug");
  const isActiveVal = watch("isActive");

  React.useEffect(() => {
    const slugifiedCurrent = slugify(slugVal || "");
    if (!slugVal || slugVal === slugifiedCurrent) {
      setValue("slug", slugify(nameVal || ""), { shouldDirty: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nameVal]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (localPreviewUrl) URL.revokeObjectURL(localPreviewUrl);
    const url = URL.createObjectURL(file);
    setLocalPreviewUrl(url);
    setValue("imageFile", file as any, { shouldDirty: true });
  };

  const clearImage = () => {
    if (localPreviewUrl) {
      URL.revokeObjectURL(localPreviewUrl);
      setLocalPreviewUrl(null);
    }
    setValue("imageFile", undefined, { shouldDirty: true });
  };

  const onSubmit = (data: EditCategoryFormData) => onSave(data);

  const previewToShow = localPreviewUrl || initial.imageUrl || "";

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50 text-black">
      <div className="fixed inset-0" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="w-full max-w-lg rounded-lg bg-white p-6 shadow-lg">
          <div className="flex items-center justify-between border-b pb-3">
            <Dialog.Title className="text-lg font-semibold text-gray-900">Edit Category</Dialog.Title>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600" aria-label="Close">
              <X className="h-5 w-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Name</label>
              <input {...register("name")} className="form-input mt-1 w-full bg-white text-black border border-gray-300 rounded-md" placeholder="e.g., Electronics" />
              {errors.name && <p className="text-sm text-red-500">{errors.name.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Slug</label>
              <input {...register("slug")} className="form-input mt-1 w-full bg-white text-black border border-gray-300 rounded-md" placeholder="electronics" />
              {errors.slug && <p className="text-sm text-red-500">{errors.slug.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Description</label>
              <textarea {...register("description")} rows={3} className="form-input mt-1 w-full bg-white text-black border border-gray-300 rounded-md" placeholder="(Optional) Short description…" />
            </div>

            <div className="pt-2">
              <ToggleBtn checked={isActiveVal} onChange={(v) => setValue("isActive", v, { shouldDirty: true })} label="Active" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category Image</label>
              {!previewToShow ? (
                <label className="flex items-center justify-center w-full h-28 border border-dashed rounded-md cursor-pointer hover:bg-gray-50 bg-white">
                  <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                  <div className="flex items-center space-x-2 text-gray-500">
                    <ImageIcon className="h-5 w-5" />
                    <span className="text-sm">Click to upload</span>
                  </div>
                </label>
              ) : (
                <div className="flex items-start space-x-3">
                  <img src={previewToShow} alt="Preview" className="h-20 w-20 rounded object-cover border" />
                  <div className="flex gap-2">
                    <label className="px-3 py-2 text-sm rounded-md border cursor-pointer hover:bg-gray-50 bg-white">
                      <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                      Change
                    </label>
                    {localPreviewUrl && (
                      <button type="button" onClick={clearImage} className="px-3 py-2 text-sm rounded-md border text-red-600 hover:bg-red-50 bg-white">
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t">
              <button
                type="button"
                onClick={() => {
                  if (localPreviewUrl) URL.revokeObjectURL(localPreviewUrl);
                  setLocalPreviewUrl(null);
                  onClose();
                }}
                className="px-4 py-2 text-sm rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50 bg-white"
              >
                Cancel
              </button>
              <button type="submit" className="px-4 py-2 text-sm rounded-md bg-primary-500 text-white hover:bg-primary-600">
                Save Changes
              </button>
            </div>
          </form>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
};

export default EditCategoryModal;
