"use client"

import { useForm } from "react-hook-form"
import { ConnectControllerFormValues } from "./types"
import { ConnectControllerSchema } from "./schema"
import { zodResolver } from "@hookform/resolvers/zod"
import { useGraph } from "../context"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/shared/ui/form"
import { Input } from "@/shared/ui/input"
import { Button } from "@/shared/ui/button"
import { cn } from "@/shared/lib/utils"
import React from "react"

export const ConnectControllerForm = ( { className, ...props }: React.ComponentProps<"form"> ) => {
  const { graph } = useGraph()

  const form = useForm<ConnectControllerFormValues>( {
    resolver: zodResolver( ConnectControllerSchema ),
    defaultValues: {
      url: "http://localhost:8080",
      interval: 5000,
      type: "floodlight",
    },
  } )

  const handle_connect = async ( values: ConnectControllerFormValues ) => {
    await graph.connect( values )
    form.reset()
  }


  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit( handle_connect )}
        className={cn( "flex flex-col gap-4", className )}
        {...props}
      >
        <FormField
          control={form.control}
          name="url"
          render={( { field } ) => (
            <FormItem>
              <FormLabel>Controller URL</FormLabel>
              <FormControl>
                <Input
                  placeholder="http://localhost:8080"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="interval"
          render={( { field } ) => (
            <FormItem>
              <FormLabel>Polling Interval (ms)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  placeholder="5000"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? "Connecting..." : "Connect"}
        </Button>
      </form>
    </Form>
  )
}
