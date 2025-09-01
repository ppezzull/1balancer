import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { ContractInput } from "./ContractInput";
import { getFunctionInputKey, getInitialTupleArrayFormState } from "./utilsContract";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "~~/components/ui/accordion";
import { Badge } from "~~/components/ui/badge";
import { Button } from "~~/components/ui/button";
import { replacer } from "~~/utils/scaffold-eth/common";
import { AbiParameterTuple } from "~~/utils/scaffold-eth/contract";

type TupleArrayProps = {
  abiTupleParameter: AbiParameterTuple & { isVirtual?: true };
  setParentForm: Dispatch<SetStateAction<Record<string, any>>>;
  parentStateObjectKey: string;
  parentForm: Record<string, any> | undefined;
};

export const TupleArray = ({ abiTupleParameter, setParentForm, parentStateObjectKey }: TupleArrayProps) => {
  const [form, setForm] = useState<Record<string, any>>(() => getInitialTupleArrayFormState(abiTupleParameter));
  const [additionalInputs, setAdditionalInputs] = useState<Array<typeof abiTupleParameter.components>>([
    abiTupleParameter.components,
  ]);

  const depth = (abiTupleParameter.type.match(/\[\]/g) || []).length;

  useEffect(() => {
    // Extract and group fields based on index prefix
    const groupedFields = Object.keys(form).reduce(
      (acc, key) => {
        const [indexPrefix, ...restArray] = key.split("_");
        const componentName = restArray.join("_");
        if (!acc[indexPrefix]) {
          acc[indexPrefix] = {};
        }
        acc[indexPrefix][componentName] = form[key];
        return acc;
      },
      {} as Record<string, Record<string, any>>,
    );

    let argsArray: Array<Record<string, any>> = [];

    Object.keys(groupedFields).forEach(key => {
      const currentKeyValues = Object.values(groupedFields[key]);

      const argsStruct: Record<string, any> = {};
      abiTupleParameter.components.forEach((component, componentIndex) => {
        argsStruct[component.name || `input_${componentIndex}_`] = currentKeyValues[componentIndex];
      });

      argsArray.push(argsStruct);
    });

    if (depth > 1) {
      argsArray = argsArray.map(args => {
        return args[abiTupleParameter.components[0].name || "tuple"];
      });
    }

    setParentForm(parentForm => {
      return { ...parentForm, [parentStateObjectKey]: JSON.stringify(argsArray, replacer) };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(form, replacer)]);

  const addInput = () => {
    setAdditionalInputs(previousValue => {
      const newAdditionalInputs = [...previousValue, abiTupleParameter.components];

      // Add the new inputs to the form
      setForm(form => {
        const newForm = { ...form };
        abiTupleParameter.components.forEach((component, componentIndex) => {
          const key = getFunctionInputKey(
            `${newAdditionalInputs.length - 1}_${abiTupleParameter.name || "tuple"}`,
            component,
            componentIndex,
          );
          newForm[key] = "";
        });
        return newForm;
      });

      return newAdditionalInputs;
    });
  };

  const removeInput = () => {
    // Remove the last inputs from the form
    setForm(form => {
      const newForm = { ...form };
      abiTupleParameter.components.forEach((component, componentIndex) => {
        const key = getFunctionInputKey(
          `${additionalInputs.length - 1}_${abiTupleParameter.name || "tuple"}`,
          component,
          componentIndex,
        );
        delete newForm[key];
      });
      return newForm;
    });
    setAdditionalInputs(inputs => inputs.slice(0, -1));
  };

  return (
    <Accordion>
      <AccordionItem className="border border-border rounded-xl">
        <AccordionTrigger className="px-4 py-2 text-foreground/80">
          <p className="m-0 text-[1rem]">{abiTupleParameter.internalType}</p>
        </AccordionTrigger>
        <AccordionContent className="px-4 pb-4">
          <div className="ml-3 flex-col space-y-2 border-border/70 border-l pl-4">
            {additionalInputs.map((additionalInput, additionalIndex) => (
              <div key={additionalIndex} className="space-y-1">
                <Badge variant="secondary" size="sm">
                  {depth > 1 ? `${additionalIndex}` : `tuple[${additionalIndex}]`}
                </Badge>
                <div className="space-y-4">
                  {additionalInput.map((param, index) => {
                    const key = getFunctionInputKey(
                      `${additionalIndex}_${abiTupleParameter.name || "tuple"}`,
                      param,
                      index,
                    );
                    return (
                      <ContractInput setForm={setForm} form={form} key={key} stateObjectKey={key} paramType={param} />
                    );
                  })}
                </div>
              </div>
            ))}
            <div className="flex gap-2 pt-2">
              <Button size="sm" variant="secondary" onClick={addInput}>
                +
              </Button>
              {additionalInputs.length > 0 && (
                <Button size="sm" variant="secondary" onClick={removeInput}>
                  -
                </Button>
              )}
            </div>
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
};
