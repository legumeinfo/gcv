import { ProcessStatus } from '@gcv/gene/models';


export const statusClasses = {
  'process-waiting': 'secondary',
  'process-running': 'secondary',
  'process-success': 'success',
  'process-error': 'danger',
  'process-warning': 'warning',
  'process-info': 'info',
};


export const statusToClass = (status: ProcessStatus): string => {
  if (status.word in statusClasses) {
    return statusClasses[status.word];
  }
  return 'secondary';
};


export const statusIcons = {
  'process-waiting': 'fas fa-ban',
  'process-running': 'fas fa-circle-notch fa-spin',
  'process-success': 'fas fa-check-circle',
  'process-error': 'fas fa-times-circle',
  'process-warning': 'fas fa-exclamation-circle',
  'process-info': 'fas fa-info-circle',
};


export const statusToIcon = (status: ProcessStatus): string => {
  if (status.word in statusIcons) {
    return statusIcons[status.word];
  }
  return 'fas fa-circle-notch fa-spin';
};
