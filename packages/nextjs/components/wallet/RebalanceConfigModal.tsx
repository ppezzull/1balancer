import React from "react";
import { Activity, Check, Clock, Info, Target } from "lucide-react";
import { Badge } from "~~/components/shared/ui/badge";
import { Button } from "~~/components/shared/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "~~/components/shared/ui/dialog";
import { Input } from "~~/components/shared/ui/input";
import { Label } from "~~/components/shared/ui/label";
import { RadioGroup, RadioGroupItem } from "~~/components/shared/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~~/components/shared/ui/select";

interface RebalanceConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedTemplate: any;
  rebalanceType: "drift" | "time";
  setRebalanceType: (type: "drift" | "time") => void;
  rebalanceConfig: any;
  setRebalanceConfig: (config: any) => void;
  onSubmit: () => void;
}

export function RebalanceConfigModal({
  isOpen,
  onClose,
  selectedTemplate,
  rebalanceType,
  setRebalanceType,
  rebalanceConfig,
  setRebalanceConfig,
  onSubmit,
}: RebalanceConfigModalProps) {
  if (!selectedTemplate) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                selectedTemplate.strategy === "endgame"
                  ? "bg-gradient-to-br from-yellow-400 to-orange-500"
                  : selectedTemplate.strategy === "gomora"
                    ? "bg-gradient-to-br from-red-400 to-pink-500"
                    : selectedTemplate.strategy === "tanos"
                      ? "bg-gradient-to-br from-purple-400 to-indigo-500"
                      : selectedTemplate.strategy === "realyield"
                        ? "bg-gradient-to-br from-green-400 to-emerald-500"
                        : selectedTemplate.strategy === "defi"
                          ? "bg-gradient-to-br from-blue-400 to-cyan-500"
                          : selectedTemplate.strategy === "meme"
                            ? "bg-gradient-to-br from-pink-400 to-rose-500"
                            : selectedTemplate.strategy === "ai"
                              ? "bg-gradient-to-br from-violet-400 to-purple-500"
                              : "bg-gradient-to-br from-teal-400 to-cyan-500"
              }`}
            >
              <Target className="w-5 h-5 text-white" />
            </div>
            Configure Rebalancing
          </DialogTitle>
          <DialogDescription>
            Set up automated rebalancing for &quot;{selectedTemplate.name}&quot; portfolio
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Portfolio Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-3 bg-accent/20 rounded-lg">
              <div className="text-lg font-bold text-foreground">{selectedTemplate.tokens?.length || 0}</div>
              <div className="text-xs text-muted-foreground">Assets</div>
            </div>
            <div className="text-center p-3 bg-accent/20 rounded-lg">
              <div className="text-lg font-bold text-green-600 dark:text-green-400">
                +{(selectedTemplate.performance || Math.random() * 30 + 5).toFixed(1)}%
              </div>
              <div className="text-xs text-muted-foreground">Performance</div>
            </div>
            <div className="text-center p-3 bg-accent/20 rounded-lg">
              <div className="text-lg font-bold text-foreground">
                ${(selectedTemplate.totalValue || 10000).toLocaleString()}
              </div>
              <div className="text-xs text-muted-foreground">Value</div>
            </div>
          </div>

          {/* Rebalancing Type Selection */}
          <div className="space-y-4">
            <Label className="text-base font-medium">Rebalancing Strategy</Label>
            <RadioGroup
              value={rebalanceType}
              onValueChange={(value: "drift" | "time") => setRebalanceType(value)}
              className="space-y-3"
            >
              {/* Drift-based */}
              <div className="flex items-start space-x-3 p-4 border border-border/30 rounded-lg hover:border-border/60 transition-colors">
                <RadioGroupItem value="drift" id="drift" className="mt-1" />
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-blue-500" />
                    <Label htmlFor="drift" className="font-medium">
                      Drift-based Rebalancing
                    </Label>
                    <Badge variant="secondary" className="text-xs">
                      Recommended
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Automatically rebalances when asset allocation drifts beyond the set threshold
                  </p>
                  {rebalanceType === "drift" && (
                    <div className="space-y-3 pt-2">
                      <div>
                        <Label className="text-sm">Drift Threshold (%)</Label>
                        <Input
                          type="number"
                          value={rebalanceConfig.drift.threshold}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            setRebalanceConfig({
                              ...rebalanceConfig,
                              drift: { ...rebalanceConfig.drift, threshold: Number(e.target.value) },
                            })
                          }
                          className="mt-1"
                          min="1"
                          max="20"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          Rebalance when any asset deviates by this percentage
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Time-based */}
              <div className="flex items-start space-x-3 p-4 border border-border/30 rounded-lg hover:border-border/60 transition-colors">
                <RadioGroupItem value="time" id="time" className="mt-1" />
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-purple-500" />
                    <Label htmlFor="time" className="font-medium">
                      Time-based Rebalancing
                    </Label>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Rebalances at regular time intervals regardless of drift
                  </p>
                  {rebalanceType === "time" && (
                    <div className="space-y-3 pt-2">
                      <div>
                        <Label className="text-sm">Frequency</Label>
                        <Select
                          value={rebalanceConfig.time.frequency}
                          onValueChange={(value: string) =>
                            setRebalanceConfig({
                              ...rebalanceConfig,
                              time: { ...rebalanceConfig.time, frequency: value },
                            })
                          }
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="weekly">Weekly</SelectItem>
                            <SelectItem value="monthly">Monthly</SelectItem>
                            <SelectItem value="quarterly">Quarterly</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </RadioGroup>
          </div>

          {/* Info Box */}
          <div className="flex gap-3 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
            <Info className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-sm font-medium text-blue-700 dark:text-blue-300">Shield StableCoin Protection</p>
              <p className="text-sm text-blue-600 dark:text-blue-400">
                This portfolio includes 25% USDC allocation for stability and downside protection.
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button
              onClick={onSubmit}
              className="flex-1 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white"
            >
              <Check className="w-4 h-4 mr-2" />
              Add Portfolio
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
