'use client';

import { ErrorAlert } from '@/components/errors/error-alert.component';
import { FormInput } from '@/components/form/formInput';
import { Alert, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import { Textarea } from '@/components/ui/textarea';
import { getErrorMessage } from '@/utils/get-error-message.util';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import * as z from 'zod';
import { useCreateItem } from '../hooks/useCreateItem.hook';
import { createItemSchema } from '../schemas/create-item.schema';
import { CreateItemData } from '../types/createItemData.type';
import { parseTags } from '../utils/parse-tags.util';
import { useRouter } from 'next/navigation';

const DEFAULT_VALUES = {
    title: '',
    description: '',
    category: '',
    tagsRaw: '',
} as const;

export function CreateItemForm() {
    const router = useRouter();
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const { handleCreateItem, error, loading } = useCreateItem();

    const form = useForm<z.infer<typeof createItemSchema>>({
        resolver: zodResolver(createItemSchema),
        defaultValues: { ...DEFAULT_VALUES },
    });

    const onSubmit = async (values: z.infer<typeof createItemSchema>) => {
        setSuccessMessage(null);
        const itemData: CreateItemData = {
            tags: parseTags(values.tagsRaw ?? '').map((t) => t.toLowerCase()),
            category: values.category.toLowerCase(),
            description: values.description,
            title: values.title,
        };
        const isSuccess = await handleCreateItem(itemData);
        if (isSuccess) {
            setSuccessMessage('Item created successfully.');
            form.reset({ ...DEFAULT_VALUES });
            router.push('/dashboard');
        }
    };

    return (
        <Card className="w-full sm:max-w-md">
            <CardHeader>
                <CardTitle>Create an item</CardTitle>
            </CardHeader>
            <CardContent>
                {successMessage && (
                    <div className="mb-4">
                        <Alert>
                            <AlertTitle>{successMessage}</AlertTitle>
                        </Alert>
                    </div>
                )}

                {error && (
                    <div className="mb-4">
                        <ErrorAlert message={getErrorMessage(error)}></ErrorAlert>
                    </div>
                )}

                <form id="create-item-form" onSubmit={form.handleSubmit(onSubmit)}>
                    <div className="flex flex-col gap-4">
                        <FormInput<typeof createItemSchema>
                            name="title"
                            control={form.control}
                            formTitle="Title"
                            placeholder="e.g. Acme Coffee"
                            minLength={5}
                            maxLength={40}
                            autoComplete="off"
                        />

                        <FormInput<typeof createItemSchema>
                            name="category"
                            control={form.control}
                            formTitle="Category"
                            placeholder="e.g. food & drink"
                            minLength={3}
                            maxLength={40}
                            autoComplete="off"
                        />

                        <Controller
                            name="description"
                            control={form.control}
                            render={({ field, fieldState }) => (
                                <Field data-invalid={fieldState.invalid}>
                                    <FieldLabel htmlFor="form-description">Description</FieldLabel>
                                    <Textarea
                                        {...field}
                                        id="form-description"
                                        aria-invalid={fieldState.invalid}
                                        placeholder="Give a short description..."
                                        rows={5}
                                        minLength={5}
                                        maxLength={500}
                                    />
                                    {fieldState.invalid && (
                                        <FieldError errors={[fieldState.error]} />
                                    )}
                                </Field>
                            )}
                        />

                        <FormInput<typeof createItemSchema>
                            name="tagsRaw"
                            control={form.control}
                            formTitle="Tags (optional)"
                            placeholder="tag1, tag2"
                            autoComplete="off"
                        />
                    </div>
                </form>
            </CardContent>
            <CardFooter className="flex-col gap-2">
                <Button type="submit" form="create-item-form" className="w-full" disabled={loading}>
                    {loading ? 'Creating…' : 'Create item'}
                </Button>
            </CardFooter>
        </Card>
    );
}
