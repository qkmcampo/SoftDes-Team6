function LoadingSpinner({ message = "Loading..." }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-10">
      <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-[#F9B672]/35 border-t-[#2C2F45]" />
      <p className="text-xs font-medium uppercase tracking-[0.18em] text-[#84848A]">{message}</p>
    </div>
  );
}

export default LoadingSpinner;
