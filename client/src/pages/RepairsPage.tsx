import { useSnackbar } from 'notistack';

export default function RepairsPage() {
  const { enqueueSnackbar } = useSnackbar();

  return (
    <div>
      <h1>Tamirler</h1>
      {/* Buraya tamir listesi veya başka içerik ekleyebilirsin */}
    </div>
  );
} 