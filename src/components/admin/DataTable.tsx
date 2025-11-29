import { ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

interface DataTableProps<T> {
  title: string;
  data: T[];
  loading?: boolean;
  renderRow: (item: T, index: number) => ReactNode;
  onAdd?: () => void;
  emptyMessage?: string;
}

export function DataTable<T>({
  title,
  data,
  loading = false,
  renderRow,
  onAdd,
  emptyMessage = 'No hay datos disponibles',
}: DataTableProps<T>) {
  if (loading) {
    return (
      <Card className="glass-card shadow-medium">
        <CardContent className="py-12">
          <div className="text-center text-muted-foreground">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Cargando datos...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-card shadow-medium">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{title}</CardTitle>
          {onAdd && (
            <Button onClick={onAdd}>
              <Plus className="mr-2 h-4 w-4" />
              Agregar
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p>{emptyMessage}</p>
          </div>
        ) : (
          <div className="space-y-2">{data.map((item, index) => renderRow(item, index))}</div>
        )}
      </CardContent>
    </Card>
  );
}

