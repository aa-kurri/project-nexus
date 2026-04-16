import { supabaseServer as createClient } from '@/lib/supabase/server';
import { LeveyJenningsChart } from '@/components/qc/LeveyJenningsChart';
import { notFound } from 'next/navigation';

export default async function QCPage({
  params,
}: {
  params: { analyte: string };
}) {
  const supabase = createClient();
  const { analyte } = params;

  // 1. Fetch QC Target
  const { data: targets } = await supabase
    .from('lims_qc_targets')
    .select('*')
    .eq('analyte_code', analyte.toUpperCase())
    .order('effective_from', { ascending: false })
    .limit(1);

  if (!targets || targets.length === 0) {
    // If no target exists, the chart cannot be rendered
    return notFound();
  }

  const target = targets[0];

  // 2. Fetch recent QC Results
  const { data: results } = await supabase
    .from('lims_qc_results')
    .select('*')
    .eq('analyte_code', analyte.toUpperCase())
    .order('run_at', { ascending: true })
    .limit(30);

  return (
    <div className="p-8 space-y-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold text-teal-50">Quality Control Dashboard</h1>
        <p className="text-teal-400">Monitoring precision and bias for {target.analyte_name}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <LeveyJenningsChart
            data={results || []}
            targetMean={Number(target.target_mean)}
            targetSD={Number(target.target_sd)}
            analyteName={target.analyte_name}
            unit={target.unit}
          />
        </div>

        <div className="space-y-6">
          <div className="bg-[#0A0E14] p-6 rounded-xl border border-teal-900/30">
            <h3 className="text-lg font-semibold text-teal-100 mb-4">Run Status</h3>
            <div className="space-y-4">
              {results?.slice(-5).reverse().map((r) => (
                <div key={r.id} className="flex justify-between items-center p-3 bg-teal-950/20 rounded-lg border border-teal-900/20">
                  <div>
                    <p className="text-sm font-medium text-teal-200">Run #{r.run_number}</p>
                    <p className="text-xs text-teal-500">{new Date(r.run_at).toLocaleString()}</p>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-bold ${Math.abs(r.z_score) > 3 ? 'text-red-400' : Math.abs(r.z_score) > 2 ? 'text-amber-400' : 'text-teal-400'}`}>
                      {r.value} {target.unit}
                    </p>
                    <p className="text-[10px] text-teal-600">z: {Number(r.z_score).toFixed(2)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="bg-[#0A0E14] p-6 rounded-xl border border-teal-900/30">
            <h3 className="text-lg font-semibold text-teal-100 mb-2">Westgard Rules</h3>
            <p className="text-xs text-teal-500 mb-4">Active monitoring for this analyte</p>
            <ul className="text-sm space-y-2 text-teal-300">
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-red-500 rounded-full" />
                <span>1-3s: Rejection</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-amber-500 rounded-full" />
                <span>1-2s: Warning</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-red-500 rounded-full" />
                <span>2-2s: Rejection</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
