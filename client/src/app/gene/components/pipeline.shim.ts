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
  'process-waiting': 'fa-ban',
  'process-running': 'fa-circle-notch fa-spin',
  'process-success': 'fa-check-circle',
  'process-error': 'fa-times-circle',
  'process-warning': 'fa-exclamation-circle',
  'process-info': 'fa-info-circle',
};


export const statusToIcon = (status: ProcessStatus): string => {
  if (status.word in statusIcons) {
    return statusIcons[status.word];
  }
  return 'fa-circle-notch fa-spin';
};
