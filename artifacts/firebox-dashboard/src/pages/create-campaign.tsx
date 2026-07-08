import { useEffect, useRef } from 'react';
import { useLocation, useParams } from 'wouter';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useCreateCampaign, useUpdateCampaign, useGetCampaign, getListCampaignsQueryKey, getGetCampaignQueryKey } from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Flame, ArrowLeft, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

const formSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100, 'Title is too long'),
  description: z.string().max(500, 'Description is too long').optional().default(''),
  targetContacts: z.coerce.number().min(1, 'Target must be at least 1').max(1000000, 'Target too large'),
  status: z.enum(['draft', 'active', 'completed']).default('draft'),
});

type FormValues = z.infer<typeof formSchema>;

export default function CreateCampaign() {
  const [, setLocation] = useLocation();
  const params = useParams();
  const isEdit = !!params.id;
  const campaignId = isEdit ? params.id : null;
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createMutation = useCreateCampaign();
  const updateMutation = useUpdateCampaign();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      description: '',
      targetContacts: 100,
      status: 'draft',
    },
  });

  const { data: existing, isLoading: isLoadingExisting } = useGetCampaign(campaignId as string, { 
    query: { enabled: isEdit, queryKey: getGetCampaignQueryKey(campaignId as string) } 
  });

  const initializedForId = useRef<string | null>(null);

  useEffect(() => {
    if (isEdit && existing && initializedForId.current !== existing.id) {
      initializedForId.current = existing.id;
      form.reset({
        title: existing.title,
        description: existing.description || '',
        targetContacts: existing.targetContacts,
        status: existing.status as any,
      });
    }
  }, [existing, form, isEdit]);

  const onSubmit = (values: FormValues) => {
    if (isEdit && campaignId) {
      updateMutation.mutate({ id: campaignId, data: values }, {
        onSuccess: () => {
          toast({ title: 'Campaign updated successfully!' });
          queryClient.invalidateQueries({ queryKey: getListCampaignsQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetCampaignQueryKey(campaignId) });
          setLocation('/campaigns');
        },
        onError: () => {
          toast({ title: 'Failed to update campaign', variant: 'destructive' });
        }
      });
    } else {
      createMutation.mutate({ data: values }, {
        onSuccess: () => {
          toast({ title: 'Campaign created successfully!' });
          queryClient.invalidateQueries({ queryKey: getListCampaignsQueryKey() });
          setLocation('/campaigns');
        },
        onError: () => {
          toast({ title: 'Failed to create campaign', variant: 'destructive' });
        }
      });
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  if (isEdit && isLoadingExisting) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-10">
      <motion.div 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="flex items-center gap-4"
      >
        <button 
          onClick={() => setLocation('/campaigns')}
          className="p-2 bg-card hover:bg-secondary border border-border rounded-lg transition-colors outline-none text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground mb-1">
            {isEdit ? 'Edit Campaign' : 'Create New VCF'}
          </h1>
          <p className="text-muted-foreground">
            {isEdit ? 'Update your campaign details and target.' : 'Setup a new lock screen to collect contacts.'}
          </p>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 bg-card border border-border rounded-[20px] p-6 md:p-8">
            <div className="space-y-6">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-foreground text-base">Campaign Title</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="e.g. Summer Networking Event" 
                        className="bg-background border-border text-foreground h-12 px-4 focus-visible:ring-primary/50" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage className="text-destructive" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-foreground text-base">Description (Optional)</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Tell visitors what they will get by unlocking this VCF..." 
                        className="bg-background border-border text-foreground min-h-[100px] p-4 focus-visible:ring-primary/50 resize-y" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage className="text-destructive" />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="targetContacts"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-foreground text-base">Target Contacts</FormLabel>
                      <FormControl>
                        <Input 
                          type="number"
                          placeholder="100" 
                          className="bg-background border-border text-foreground h-12 px-4 focus-visible:ring-primary/50" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage className="text-destructive" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-foreground text-base">Initial Status</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="bg-background border-border text-foreground h-12 px-4 focus:ring-primary/50">
                            <SelectValue placeholder="Select a status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-card border-border">
                          <SelectItem value="draft" className="text-foreground focus:bg-secondary focus:text-foreground">Draft (Not visible)</SelectItem>
                          <SelectItem value="active" className="text-foreground focus:bg-secondary focus:text-foreground">Active (Collecting)</SelectItem>
                          <SelectItem value="completed" className="text-foreground focus:bg-secondary focus:text-foreground">Completed</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage className="text-destructive" />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className="pt-6 mt-6 border-t border-border flex items-center justify-end gap-4">
              <Button 
                type="button" 
                variant="ghost" 
                className="text-muted-foreground hover:text-foreground hover:bg-secondary"
                onClick={() => setLocation('/campaigns')}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold px-8 h-12 flex items-center gap-2 shadow-[0_0_15px_rgba(22,163,74,0.2)] hover:shadow-[0_0_20px_rgba(22,163,74,0.4)] transition-all"
                disabled={isPending}
              >
                {isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Flame className="w-5 h-5" />}
                {isEdit ? 'Save Changes' : 'Ignite Campaign'}
              </Button>
            </div>
          </form>
        </Form>
      </motion.div>
    </div>
  );
}