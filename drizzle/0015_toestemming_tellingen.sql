CREATE TABLE "toestemming_tellingen" (
	"dag" date NOT NULL,
	"keuze" text NOT NULL,
	"aantal" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "toestemming_tellingen_dag_keuze_pk" PRIMARY KEY("dag","keuze")
);
