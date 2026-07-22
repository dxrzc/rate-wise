import { CreateItemForm } from '@/features/items/components/create-item-form.component';

export default function CreateItemPage() {
    return (
        <div className="flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
            <CreateItemForm />
        </div>
    );
}
